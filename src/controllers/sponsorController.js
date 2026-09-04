const crypto = require("crypto");
const { Op } = require("sequelize");
const { Sponsor, SponsorImpression } = require("../models");

const TIERS = ["local", "gold", "platinum"];
const IMPRESSION_TYPES = ["impression", "click"];

function hashIp(ip) {
  return crypto.createHash("sha256").update(String(ip || "unknown")).digest("hex").slice(0, 32);
}

// Public: GET /api/sponsors?city=Atlanta
// City-specific sponsors are returned first, followed by general (city:
// null) sponsors as a fallback fill — so the rotation always has enough
// sponsors to show even if none are targeted at the visitor's city.
async function listSponsors(req, res, next) {
  try {
    const { city } = req.query;

    const where = city
      ? { [Op.or]: [{ city: { [Op.like]: city } }, { city: null }] }
      : {};

    const sponsors = await Sponsor.findAll({
      where,
      order: [["tier", "ASC"], ["name", "ASC"]],
    });

    if (city) {
      // City-matches first, general sponsors after — keeps ordering
      // predictable for the rotation component.
      sponsors.sort((a, b) => {
        const aMatch = a.city && a.city.toLowerCase() === String(city).toLowerCase() ? 0 : 1;
        const bMatch = b.city && b.city.toLowerCase() === String(city).toLowerCase() ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    res.json({ success: true, sponsors });
  } catch (error) {
    next(error);
  }
}

// Admin-only: POST /api/sponsors
async function createSponsor(req, res, next) {
  try {
    const { name, logoUrl, url, tier, city } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: "name is required" });
    if (tier && !TIERS.includes(tier)) {
      return res.status(400).json({ success: false, error: `tier must be one of: ${TIERS.join(", ")}` });
    }

    const sponsor = await Sponsor.create({
      name,
      logoUrl: logoUrl || null,
      url: url || null,
      tier: tier || "local",
      city: city ? String(city).trim() : null,
    });

    res.status(201).json({ success: true, sponsor });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/sponsors/:id
async function updateSponsor(req, res, next) {
  try {
    const sponsor = await Sponsor.findByPk(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, error: "Sponsor not found" });

    const { name, logoUrl, url, tier, city } = req.body || {};
    if (tier !== undefined && !TIERS.includes(tier)) {
      return res.status(400).json({ success: false, error: `tier must be one of: ${TIERS.join(", ")}` });
    }

    await sponsor.update({
      ...(name !== undefined ? { name } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(tier !== undefined ? { tier } : {}),
      ...(city !== undefined ? { city: city ? String(city).trim() : null } : {}),
    });

    res.json({ success: true, sponsor });
  } catch (error) {
    next(error);
  }
}

// Admin-only: DELETE /api/sponsors/:id
async function deleteSponsor(req, res, next) {
  try {
    const sponsor = await Sponsor.findByPk(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, error: "Sponsor not found" });
    await sponsor.destroy();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// Public: POST /api/sponsors/:id/impressions  { type?: "impression"|"click", city? }
// Fired by the SponsorBar every time a sponsor becomes visible, and again
// (with type "click") if the visitor clicks through.
async function trackSponsorImpression(req, res, next) {
  try {
    const sponsor = await Sponsor.findByPk(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, error: "Sponsor not found" });

    const { type, city } = req.body || {};
    const impressionType = IMPRESSION_TYPES.includes(type) ? type : "impression";

    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = (typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : null) || req.ip;
    const ipHash = hashIp(ip);

    // Only de-dupe plain impressions (guards against double-fires from
    // React effects re-running) — never de-dupe clicks, those are always
    // intentional.
    if (impressionType === "impression") {
      const recent = await SponsorImpression.findOne({
        where: { sponsorId: sponsor.id, ipHash, type: "impression" },
        order: [["createdAt", "DESC"]],
      });
      const isDuplicate = !!recent && Date.now() - new Date(recent.createdAt).getTime() < 5000;
      if (isDuplicate) return res.status(201).json({ success: true, deduped: true });
    }

    await SponsorImpression.create({
      sponsorId: sponsor.id,
      type: impressionType,
      city: city ? String(city).trim().slice(0, 120) : null,
      ipHash,
    });

    res.status(201).json({ success: true, deduped: false });
  } catch (error) {
    next(error);
  }
}

// Admin-only: GET /api/sponsors/impressions/summary
// Per-sponsor impression/click counts for the admin analytics view.
async function getSponsorImpressionSummary(req, res, next) {
  try {
    const sponsors = await Sponsor.findAll({ order: [["tier", "ASC"], ["name", "ASC"]] });
    const rows = await SponsorImpression.findAll({
      attributes: [
        "sponsorId",
        "type",
        [SponsorImpression.sequelize.fn("COUNT", "*"), "count"],
      ],
      group: ["sponsorId", "type"],
    });

    const bySponsor = {};
    rows.forEach((r) => {
      const id = r.sponsorId;
      if (!bySponsor[id]) bySponsor[id] = { impressions: 0, clicks: 0 };
      if (r.type === "click") bySponsor[id].clicks = Number(r.get("count"));
      else bySponsor[id].impressions = Number(r.get("count"));
    });

    const summary = sponsors.map((s) => ({
      sponsorId: s.id,
      name: s.name,
      city: s.city,
      tier: s.tier,
      impressions: bySponsor[s.id]?.impressions || 0,
      clicks: bySponsor[s.id]?.clicks || 0,
    }));

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  trackSponsorImpression,
  getSponsorImpressionSummary,
};