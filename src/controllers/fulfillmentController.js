const { Fulfillment, Home, Nomination } = require("../models");
const { sendEmail } = require("../utils/notify");
const STATUSES = ["pending", "shipped", "delivered"];

// Admin-only: GET /api/fulfillments?status=
async function listFulfillments(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status && STATUSES.includes(status)) where.status = status;

    const fulfillments = await Fulfillment.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 200,
      include: [
        { model: Home, as: "home", attributes: ["id", "address", "slug"] },
        { model: Nomination, as: "nomination", attributes: ["id", "address"] },
      ],
    });

    res.json({ success: true, fulfillments });
  } catch (error) {
    next(error);
  }
}

// Admin-only: POST /api/fulfillments
async function createFulfillment(req, res, next) {
  try {
    const { recipientName, recipientEmail, item, notes, homeId, nominationId, status } = req.body || {};
    if (!recipientName || !item) {
      return res.status(400).json({ success: false, error: "recipientName and item are required" });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${STATUSES.join(", ")}` });
    }

    const fulfillment = await Fulfillment.create({
      recipientName,
      recipientEmail: recipientEmail || null,
      item,
      notes: notes || null,
      homeId: homeId || null,
      nominationId: nominationId || null,
      status: status || "pending",
    });

    res.status(201).json({ success: true, fulfillment });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/fulfillments/:id
async function updateFulfillment(req, res, next) {
  try {
    const fulfillment = await Fulfillment.findByPk(req.params.id);
    if (!fulfillment) return res.status(404).json({ success: false, error: "Fulfillment not found" });

    const { status, notes, item, recipientName, recipientEmail } = req.body || {};
    if (status !== undefined && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of: ${STATUSES.join(", ")}` });
    }

    await fulfillment.update({
      ...(status !== undefined ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(item !== undefined ? { item } : {}),
      ...(recipientName !== undefined ? { recipientName } : {}),
      ...(recipientEmail !== undefined ? { recipientEmail } : {}),
    });

    // Supplementary — never block the status update on a notification
    // failure.
    if ((status === "shipped" || status === "delivered") && fulfillment.recipientEmail) {
      const copy =
        status === "shipped"
          ? `Hi ${fulfillment.recipientName}, your ${fulfillment.item} is on its way!`
          : `Hi ${fulfillment.recipientName}, your ${fulfillment.item} has been delivered!`;

      sendEmail({
        to: fulfillment.recipientEmail,
        subject: `Your ${fulfillment.item} has ${status === "shipped" ? "shipped" : "arrived"}`,
        text: copy,
      }).catch(() => { });
    }

    res.json({ success: true, fulfillment });
  } catch (error) {
    next(error);
  }
}

// Admin-only: DELETE /api/fulfillments/:id
async function deleteFulfillment(req, res, next) {
  try {
    const fulfillment = await Fulfillment.findByPk(req.params.id);
    if (!fulfillment) return res.status(404).json({ success: false, error: "Fulfillment not found" });
    await fulfillment.destroy();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { listFulfillments, createFulfillment, updateFulfillment, deleteFulfillment };