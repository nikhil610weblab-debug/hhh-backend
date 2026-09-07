const { NearbyAlertSubscription } = require("../models");

const MAX_ACTIVE_SUBSCRIPTIONS = 5;
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 50;

async function listMySubscriptions(req, res, next) {
  try {
    const subscriptions = await NearbyAlertSubscription.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, subscriptions });
  } catch (error) {
    next(error);
  }
}

async function createSubscription(req, res, next) {
  try {
    const { address, lat, lng, radiusMiles } = req.body || {};

    if (!address || typeof lat !== "number" || typeof lng !== "number") {
      return res.status(400).json({ success: false, error: "address, lat and lng are required" });
    }

    const radius = typeof radiusMiles === "number" ? radiusMiles : 10;
    if (radius < MIN_RADIUS_MILES || radius > MAX_RADIUS_MILES) {
      return res.status(400).json({
        success: false,
        error: `radiusMiles must be between ${MIN_RADIUS_MILES} and ${MAX_RADIUS_MILES}`,
      });
    }

    const activeCount = await NearbyAlertSubscription.count({
      where: { userId: req.user.id, isActive: true },
    });
    if (activeCount >= MAX_ACTIVE_SUBSCRIPTIONS) {
      return res.status(400).json({
        success: false,
        error: `You can have up to ${MAX_ACTIVE_SUBSCRIPTIONS} active alerts. Remove one before adding another.`,
      });
    }

    const subscription = await NearbyAlertSubscription.create({
      userId: req.user.id,
      address,
      lat,
      lng,
      radiusMiles: radius,
    });

    res.status(201).json({ success: true, subscription });
  } catch (error) {
    next(error);
  }
}

async function deleteSubscription(req, res, next) {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== "admin") where.userId = req.user.id;

    const subscription = await NearbyAlertSubscription.findOne({ where });
    if (!subscription) {
      return res.status(404).json({ success: false, error: "Subscription not found" });
    }

    await subscription.destroy();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { listMySubscriptions, createSubscription, deleteSubscription };