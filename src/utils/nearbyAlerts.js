const { NearbyAlertSubscription, User } = require("../models");
const { sendEmail, sendSms } = require("./notify");
const { haversineMiles } = require("./geo");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Called from the nomination-approval flow. Fire-and-forget: a notification
// failure should never affect the approval response the admin sees.
async function notifyNearbySubscribers(home) {
  const subscriptions = await NearbyAlertSubscription.findAll({
    where: { isActive: true },
    include: [{ model: User, as: "user", attributes: ["id", "name", "email", "phone"] }],
  });

  const matches = subscriptions.filter(
    (sub) => haversineMiles(home.lat, home.lng, sub.lat, sub.lng) <= sub.radiusMiles
  );

  const homeLabel = home.title || `${home.address}, ${home.city}`;
  const link = `${FRONTEND_URL}/h?home=${home.slug}`;

  await Promise.all(
    matches.map(async (sub) => {
      const user = sub.user;
      if (!user) return;

      sendEmail({
        to: user.email,
        subject: "A new home just went up near you!",
        text: `Hi ${user.name}, a new home was just added to Home Holiday Hunt near ${sub.address}: ${homeLabel}. See it here: ${link}`,
      }).catch(() => {});

      sendSms(user.phone, `HHH: A new home just went up near you (${homeLabel}). ${link}`).catch(() => {});

      await sub.update({ lastNotifiedAt: new Date() });
    })
  );
}

module.exports = { notifyNearbySubscribers };