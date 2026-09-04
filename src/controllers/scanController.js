const crypto = require("crypto");
const { Home, ScanEvent } = require("../models");

function hashIp(ip) {
  return crypto.createHash("sha256").update(String(ip || "unknown")).digest("hex").slice(0, 32);
}

// Public: POST /api/scans  { slug? , homeId?, source? }
// Called by the frontend whenever a visitor lands on a home via QR code or
// shared link. No auth required — this is fired from a public page.
async function trackScan(req, res, next) {
  try {
    const { slug, homeId, source } = req.body || {};
    if (!slug && !homeId) {
      return res.status(400).json({ success: false, error: "slug or homeId is required" });
    }

    const home = homeId
      ? await Home.findByPk(homeId)
      : await Home.findOne({ where: { slug } });

    if (!home) {
      return res.status(404).json({ success: false, error: "Home not found" });
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = (typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : null) || req.ip;
    const ipHash = hashIp(ip);
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);
    const referrer = String(req.body?.referrer || req.headers["referer"] || "").slice(0, 255) || null;

    // Soft de-dupe: ignore repeat scans from the same visitor within 30s
    // (page refresh, double navigation) so counts stay meaningful.
    const recent = await ScanEvent.findOne({
      where: { homeId: home.id, ipHash },
      order: [["createdAt", "DESC"]],
    });
    const isDuplicate = !!recent && Date.now() - new Date(recent.createdAt).getTime() < 30 * 1000;

    if (!isDuplicate) {
      await ScanEvent.create({
        homeId: home.id,
        source: ["qr", "link", "other"].includes(source) ? source : "qr",
        ipHash,
        userAgent,
        referrer,
      });
    }

    const totalScans = await ScanEvent.count({ where: { homeId: home.id } });

    res.status(201).json({ success: true, totalScans, deduped: isDuplicate });
  } catch (error) {
    next(error);
  }
}

module.exports = { trackScan };