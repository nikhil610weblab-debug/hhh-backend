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

// Homeowner hearts (or un-hearts) a visitor's message. Ownership is
// checked against the home's real ownerId now that we have real auth,
// instead of trusting an email in the request body like the original did.
async function toggleMessageFavorite(req, res, next) {
  try {
    const message = await Message.findByPk(req.params.id, {
      include: [{ model: Home, as: "home" }],
    });
    if (!message) {
      return res.status(404).json({ success: false, error: "Message not found" });
    }

    const isOwner = message.home && message.home.ownerId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: "You don't manage this listing" });
    }

    await message.update({ favorited: Boolean(req.body?.favorited) });
    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
}

// One rating per visitor counts toward the average, no matter how many
// times they've rated this home. Identity is authorId when signed in,
// visitorId (a client-generated id in localStorage) for guests. Older
// anonymous ratings with neither value each count individually, same as
// before — there's no way to tell those apart retroactively.
async function recomputeHomeRating(home) {
  const rated = await Message.findAll({
    where: { homeId: home.id, rating: { [require("sequelize").Op.not]: null } },
    order: [["createdAt", "DESC"]],
  });

  const latestByVisitor = new Map();
  for (const m of rated) {
    const key = m.authorId ? `user:${m.authorId}` : m.visitorId ? `visitor:${m.visitorId}` : `row:${m.id}`;
    if (!latestByVisitor.has(key)) {
      latestByVisitor.set(key, m.rating); // first hit per key is the newest, since sorted DESC
    }
  }

  const values = [...latestByVisitor.values()];
  const count = values.length;
  const avg = count ? values.reduce((sum, r) => sum + r, 0) / count : 0;
  await home.update({ ratingAvg: avg, ratingCount: count });
}
async function createMessage(req, res, next) {
  try {
    const { homeId, body, authorName, rating, visitorId } = req.body || {};

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
      // Only need this for guests — logged-in visitors are already
      // identified by authorId, which can't be reset like localStorage can.
      visitorId: req.user ? null : (typeof visitorId === "string" ? visitorId : null),
    });


    if (typeof rating === "number") {
      await recomputeHomeRating(home);
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
module.exports = { listMessages, createMessage,  toggleMessageFavorite };