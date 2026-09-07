const { Op } = require("sequelize");
const { Home } = require("../models");
const crypto = require("crypto");
const { sendEmail, sendSms } = require("../utils/notify");

function makeSlug(address, city) {
  return `${address}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") + `-${Date.now()}`;
}

const CLAIM_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateClaimCode() {
  // 6 digits, zero-padded — e.g. "042917"
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashClaimCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}
// Guests get everything about a home except the exact street address — the
// homepage promises "sign up to unlock addresses", so gate it here instead
// of trusting every frontend view to remember to hide it.
function serializeHome(home, canSeeAddress) {
  const plain = home.toJSON();
  if (!canSeeAddress) {
    plain.address = null;
    plain.addressLocked = true;
  } else {
    plain.addressLocked = false;
  }
  return plain;
}
// POST /api/homes/:id/claim/request
// Only unclaimed homes (ownerId === null) can be claimed — this is how a
// homeowner takes ownership of a listing that came from an approved
// nomination rather than one they created themselves.
async function requestHomeClaim(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });

    if (home.ownerId) {
      return res.status(400).json({ success: false, error: "This home has already been claimed" });
    }

    const code = generateClaimCode();
    await home.update({
      claimCodeHash: hashClaimCode(code),
      claimCodeExpiresAt: new Date(Date.now() + CLAIM_CODE_TTL_MS),
      claimRequestedBy: req.user.id,
    });

    // Best-effort delivery on whatever contact info this account has —
    // matches the proposal's "automated message" fallback. Physical mail
    // to the property address itself is out of scope without a mail-API
    // integration (e.g. Lob) and isn't attempted here.
    sendEmail({
      to: req.user.email,
      subject: "Your Home Holiday Hunt claim code",
      text: `Hi ${req.user.name}, your verification code to claim ${home.address} is: ${code}\n\nEnter this code in your dashboard within 7 days to complete your claim. If you didn't request this, you can ignore this email.`,
    }).catch(() => { });

    if (req.user.phone) {
      sendSms(
        req.user.phone,
        `Home Holiday Hunt: your claim code for ${home.address} is ${code}. It expires in 7 days.`
      ).catch(() => { });
    }

    res.json({
      success: true,
      message: "A verification code has been sent. Enter it below to complete your claim.",
    });
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
    if (home.claimRequestedBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "No pending claim request for this home under your account. Request a code first.",
      });
    }
    if (!home.claimCodeHash || !home.claimCodeExpiresAt || home.claimCodeExpiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "This code has expired. Please request a new one." });
    }
    if (hashClaimCode(code) !== home.claimCodeHash) {
      return res.status(400).json({ success: false, error: "Incorrect code. Please try again." });
    }

    await home.update({
      ownerId: req.user.id,
      claimCodeHash: null,
      claimCodeExpiresAt: null,
      claimRequestedBy: null,
    });

    res.json({ success: true, home });
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
    res.json({ success: true, home });
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
    res.json({ success: true, homes });
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

    res.status(201).json({ success: true, home });
  } catch (error) {
    next(error);
  }
}

// Homeowner (or admin): PATCH /api/homes/:id
// Lets a homeowner edit the details on their own listing — visiting hours,
// a thank-you note for guests, and an optional charity link. Admins can
// edit any home; homeowners can only edit homes they own.
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

    res.json({ success: true, home });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listHomes, getHome, getHomeBySlug, getMyHomes, createHome, updateHome, requestHomeClaim,
  verifyHomeClaim,
};