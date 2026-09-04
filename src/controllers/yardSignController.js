const { Home, Fulfillment, User } = require("../models");
const { sendEmail, sendSms } = require("../utils/notify");

const STATUSES = ["requested", "printed", "delivered"];
const STATUS_FIELD = {
  requested: "yardSignRequestedAt",
  printed: "yardSignPrintedAt",
  delivered: "yardSignDeliveredAt",
};

// Admin-only: GET /api/yard-signs?status=
async function listYardSigns(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status && STATUSES.includes(status)) where.yardSignStatus = status;

    const homes = await Home.findAll({
      where,
      attributes: [
        "id", "address", "city", "state", "slug", "title",
        "yardSignStatus", "yardSignRequestedAt", "yardSignPrintedAt", "yardSignDeliveredAt",
      ],
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

    res.json({ success: true, homes });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/yard-signs/:homeId  { status }
async function updateYardSignStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${STATUSES.join(", ")}` });
    }

    const home = await Home.findByPk(req.params.homeId);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });

    await home.update({
      yardSignStatus: status,
      [STATUS_FIELD[status]]: new Date(),
    });

    // Let the homeowner know their sign shipped/arrived — supplementary,
    // so a notification failure never blocks the status update itself.
    if (home.ownerId && (status === "printed" || status === "delivered")) {
      const owner = await User.findByPk(home.ownerId);
      if (owner) {
        const label = home.title || home.address;
        const copy =
          status === "printed"
            ? `Your yard sign for ${label} has been printed and is on its way!`
            : `Your yard sign for ${label} has been delivered. Look out for it!`;

        sendEmail({ to: owner.email, subject: "Yard sign update", text: copy }).catch(() => { });
        sendSms(owner.phone, `HHH: ${copy}`).catch(() => { });
      }
    }

    res.json({ success: true, home });
  } catch (error) {
    next(error);
  }
}

// Homeowner (or admin): POST /api/yard-signs/:homeId/replacement-request
// Lets a homeowner report their physical sign lost, damaged, or faded and
// ask for a new one. This bumps the home back into the admin's
// requested -> printed -> delivered queue and drops a Fulfillment record
// (reason + timestamp) so admins have a paper trail, reusing the existing
// Fulfillments panel rather than building a second admin UI.
async function requestReplacement(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.homeId);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });

    const isOwner = home.ownerId && home.ownerId === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You do not have permission to request a sign for this listing" });
    }

    const reason = String(req.body?.reason || "").trim().slice(0, 500) || null;

    await home.update({
      yardSignStatus: "requested",
      yardSignRequestedAt: new Date(),
    });

    const fulfillment = await Fulfillment.create({
      recipientName: home.title || home.address,
      item: "Yard Sign (Replacement)",
      status: "pending",
      notes: reason,
      homeId: home.id,
    });

    // Nudge the admin team so a replacement doesn't sit unnoticed in the
    // queue — supplementary, so a bad ADMIN_NOTIFY_EMAIL never blocks the
    // homeowner's request from being recorded.
    if (process.env.ADMIN_NOTIFY_EMAIL) {
      sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: "Yard sign replacement requested",
        text: `${home.title || home.address} needs a replacement yard sign.${reason ? `\n\nReason: ${reason}` : ""}`,
      }).catch(() => { });
    }

    res.status(201).json({ success: true, home, fulfillment });
  } catch (error) {
    next(error);
  }
}

module.exports = { listYardSigns, updateYardSignStatus, requestReplacement };