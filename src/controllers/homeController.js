const { Op } = require("sequelize");
const { Home } = require("../models");
const crypto = require("crypto");

function makeSlug(address, city) {
  return `${address}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") + `-${Date.now()}`;
}

const CLAIM_CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CLAIM_ATTEMPTS = 5;

function generateClaimCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[crypto.randomInt(0, chars.length)];
  return out;
}

function hashClaimCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// Never send claim-related secrets to the browser.
function stripClaimFields(plain) {
  delete plain.claimCodeHash;
  delete plain.claimCodeExpiresAt;
  delete plain.claimRequestedBy;
  delete plain.claimAttempts;
  return plain;
}

// Guests get everything about a home except the exact street address.
function serializeHome(home, canSeeAddress) {
  const plain = stripClaimFields(home.toJSON());
  if (!canSeeAddress) {
    plain.address = null;
    plain.addressLocked = true;
  } else {
    plain.addressLocked = false;
  }
  return plain;
}

// POST /api/homes/:id/claim/generate  (admin only)
async function generateHomeClaimCode(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });
    if (home.ownerId) {
      return res.status(400).json({ success: false, error: "This home has already been claimed" });
    }

    const code = generateClaimCode();
    const expiresAt = new Date(Date.now() + CLAIM_CODE_TTL_MS);
    await home.update({
      claimCodeHash: hashClaimCode(code),
      claimCodeExpiresAt: expiresAt,
      claimRequestedBy: null,
      claimAttempts: 0,
    });

    res.json({ success: true, code, expiresAt });
  } catch (error) {
    next(error);
  }
}

// POST /api/homes/:id/claim/verify  { code }
async function verifyHomeClaim(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });

    const { code } = req.body || {};
    if (!code) return res.status(400).json({ success: false, error: "code is required" });

    if (home.ownerId) {
      return res.status(400).json({ success: false, error: "This home has already been claimed" });
    }
    if (!home.claimCodeHash || !home.claimCodeExpiresAt || home.claimCodeExpiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "No valid code for this home. Contact support." });
    }
    if (home.claimAttempts >= MAX_CLAIM_ATTEMPTS) {
      return res.status(429).json({ success: false, error: "Too many wrong attempts. Contact support for a new code." });
    }
    if (hashClaimCode(String(code).trim().toUpperCase()) !== home.claimCodeHash) {
      await home.increment("claimAttempts");
      return res.status(400).json({ success: false, error: "Incorrect code." });
    }

    await home.update({
      ownerId: req.user.id,
      claimCodeHash: null,
      claimCodeExpiresAt: null,
      claimRequestedBy: null,
      claimAttempts: 0,
    });

    res.json({ success: true, home: serializeHome(home, true) });
  } catch (error) {
    next(error);
  }
}

async function listHomes(req, res, next) {
  try {
    const { city, eventId, address, unclaimed } = req.query;
    const where = { isActive: true };
    if (city) where.city = { [Op.like]: `%${city}%` };
    if (eventId) where.eventId = eventId;
    if (address) where.address = { [Op.like]: `%${address}%` };
    if (unclaimed === "true") where.ownerId = null;

    const homes = await Home.findAll({ where, order: [["createdAt", "DESC"]], limit: 100 });
    const canSeeAddress = Boolean(req.user);
    res.json({ success: true, homes: homes.map((h) => serializeHome(h, canSeeAddress)) });
  } catch (error) {
    next(error);
  }
}

async function getHome(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });
    res.json({ success: true, home: serializeHome(home, Boolean(req.user)) });
  } catch (error) {
    next(error);
  }
}

async function getHomeBySlug(req, res, next) {
  try {
    const home = await Home.findOne({ where: { slug: req.params.slug } });
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });
    res.json({ success: true, home: stripClaimFields(home.toJSON()) });
  } catch (error) {
    next(error);
  }
}

async function getMyHomes(req, res, next) {
  try {
    const homes = await Home.findAll({
      where: { ownerId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, homes: homes.map((h) => stripClaimFields(h.toJSON())) });
  } catch (error) {
    next(error);
  }
}

async function createHome(req, res, next) {
  try {
    const { address, city, state, lat, lng, title, description, photoUrl, eventId } = req.body || {};
    if (!address || !city || !state || typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ success: false, error: "address, city, state, lat and lng are required" });
    }

    const home = await Home.create({
      address, city, state, lat, lng, title, description, photoUrl, eventId,
      ownerId: req.user.id,
      slug: makeSlug(address, city),
    });

    res.status(201).json({ success: true, home: stripClaimFields(home.toJSON()) });
  } catch (error) {
    next(error);
  }
}

// Homeowner (or admin): PATCH /api/homes/:id
async function updateHome(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });

    const isOwner = home.ownerId && home.ownerId === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You do not have permission to edit this listing" });
    }

    const {
      title,
      description,
      photoUrl,
      listingHours,
      thankYouNote,
      charityName,
      charityLink,
    } = req.body || {};

    if (charityLink !== undefined && charityLink !== null && charityLink !== "") {
      try {
        new URL(charityLink);
      } catch {
        return res.status(400).json({ success: false, error: "charityLink must be a valid URL" });
      }
    }

    await home.update({
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(listingHours !== undefined ? { listingHours } : {}),
      ...(thankYouNote !== undefined ? { thankYouNote } : {}),
      ...(charityName !== undefined ? { charityName } : {}),
      ...(charityLink !== undefined ? { charityLink } : {}),
    });

    res.json({ success: true, home: stripClaimFields(home.toJSON()) });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listHomes,
  getHome,
  getHomeBySlug,
  getMyHomes,
  createHome,
  updateHome,
  generateHomeClaimCode,
  verifyHomeClaim,
};