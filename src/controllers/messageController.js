const { Message, Home, User } = require("../models");
const { sendEmail, sendSms } = require("../utils/notify")

async function listMessages(req, res, next) {
  try {
    const { homeId } = req.query;
    if (!homeId) {
      return res.status(400).json({ success: false, error: "homeId is required" });
    }

    const messages = await Message.findAll({
      where: { homeId },
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
}

async function createMessage(req, res, next) {
  try {
    const { homeId, body, authorName, rating } = req.body || {};

    if (!homeId || !body) {
      return res.status(400).json({ success: false, error: "homeId and body are required" });
    }

    const home = await Home.findByPk(homeId);
    if (!home) {
      return res.status(404).json({ success: false, error: "Home not found" });
    }

    const message = await Message.create({
      homeId,
      body,
      authorId: req.user ? req.user.id : null,
      authorName: authorName || (req.user ? req.user.name : "Guest"),
      rating: typeof rating === "number" ? rating : null,
    });

    if (typeof rating === "number") {
      const all = await Message.findAll({ where: { homeId, rating: { [require("sequelize").Op.not]: null } } });
      const count = all.length;
      const avg = count ? all.reduce((sum, m) => sum + m.rating, 0) / count : 0;
      await home.update({ ratingAvg: avg, ratingCount: count });
    }

    // Let the homeowner know someone stopped by — supplementary, so
    // failures here never block the guest's message from saving.
    if (home.ownerId) {
      const owner = await User.findByPk(home.ownerId);
      if (owner) {
        const preview = body.length > 140 ? `${body.slice(0, 140)}...` : body;
        const ratingLine = typeof rating === "number" ? ` They also left a ${rating}-star rating.` : "";

        sendEmail({
          to: owner.email,
          subject: `New message on your listing: ${home.title || home.address}`,
          text: `${message.authorName} wrote:\n\n"${preview}"${ratingLine}\n\nView it on your dashboard.`,
        }).catch(() => { });

        sendSms(
          owner.phone,
          `HHH: New message on ${home.title || home.address} from ${message.authorName}.${ratingLine}`
        ).catch(() => { });
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
}

module.exports = { listMessages, createMessage };