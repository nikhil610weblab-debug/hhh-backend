const { Nomination, Home, Event, User } = require("../models");
const { sendEmail } = require("../utils/notify");

function makeSlug(address, city) {
  return (
    `${address}-${city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + `-${Date.now()}`
  );
}

async function createNomination(req, res, next) {
  try {
    const { address, lat, lng, notes, photoUrl } = req.body || {};
    if (!address) return res.status(400).json({ success: false, error: "address is required" });

    const nomination = await Nomination.create({
      address,
      lat,
      lng,
      notes,
      photoUrl,
      nominatorId: req.user?.id || null,
    });

    res.status(201).json({ success: true, nomination, xpAwarded: req.user ? 50 : 0 });
  } catch (error) {
    next(error);
  }
}

// Admin moderation queue: GET /api/nominations?status=pending
async function listNominations(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status;
    }

    const nominations = await Nomination.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 100,
      include: [
        { model: User, as: "nominator", attributes: ["id", "name", "email"] },
        { model: User, as: "reviewer", attributes: ["id", "name"] },
        { model: Home, as: "home", attributes: ["id", "slug"] },
      ],
    });

    res.json({ success: true, nominations });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/nominations/:id
// Approve converts the nomination into a live Home listing; reject just
// closes it out. Both are one-time actions — a nomination that has already
// been reviewed cannot be reviewed again.
async function reviewNomination(req, res, next) {
  try {
    const { status, city, state, title, description, eventId } = req.body || {};

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be 'approved' or 'rejected'" });
    }

    const nomination = await Nomination.findByPk(req.params.id, {
      include: [{ model: User, as: "nominator", attributes: ["id", "name", "email"] }],
    });
    if (!nomination) {
      return res.status(404).json({ success: false, error: "Nomination not found" });
    }
    if (nomination.status !== "pending") {
      return res.status(400).json({ success: false, error: `This nomination was already ${nomination.status}` });
    }

    if (status === "rejected") {
      await nomination.update({ status: "rejected", reviewerId: req.user.id, reviewedAt: new Date() });

      if (nomination.nominator?.email) {
        sendEmail({
          to: nomination.nominator.email,
          subject: "Update on your Home Holiday Hunt nomination",
          text: `Hi ${nomination.nominator.name}, thanks for nominating ${nomination.address}. After review, we won't be adding it to the tour this time. Thanks for helping us find great displays!`,
        }).catch(() => { });
      }

      return res.json({ success: true, nomination });
    }

    // Approving requires enough info to create a real Home row.
    if (!city || !state) {
      return res.status(400).json({ success: false, error: "city and state are required to approve a nomination" });
    }
    if (typeof nomination.lat !== "number" || typeof nomination.lng !== "number") {
      return res.status(400).json({ success: false, error: "This nomination has no map coordinates and can't be approved yet" });
    }

    let resolvedEventId = eventId;
    if (!resolvedEventId) {
      const activeEvent = await Event.findOne({ where: { status: "active" } });
      resolvedEventId = activeEvent ? activeEvent.id : null;
    }

    const home = await Home.create({
      address: nomination.address,
      city,
      state,
      lat: nomination.lat,
      lng: nomination.lng,
      title: title || null,
      description: description || nomination.notes || null,
      photoUrl: nomination.photoUrl || null,
      eventId: resolvedEventId,
      ownerId: null, // Unclaimed until the real homeowner verifies ownership.
      slug: makeSlug(nomination.address, city),
    });

    await nomination.update({
      status: "approved",
      reviewerId: req.user.id,
      reviewedAt: new Date(),
      homeId: home.id,
    });

    if (nomination.nominator?.email) {
      sendEmail({
        to: nomination.nominator.email,
        subject: "Your Home Holiday Hunt nomination was approved!",
        text: `Hi ${nomination.nominator.name}, great news — ${nomination.address} was approved and is now live on the map! Thanks for the nomination.`,
      }).catch(() => { });
    }

    res.json({ success: true, nomination, home });
  } catch (error) {
    next(error);
  }
}

module.exports = { createNomination, listNominations, reviewNomination };