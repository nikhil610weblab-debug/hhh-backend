const { Op } = require("sequelize");
const { User, Home, Nomination, Sponsor, Message, Fulfillment, Event, ScanEvent } = require("../models");

// Admin-only: GET /api/analytics
async function getAnalytics(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      usersByRole,
      totalHomes,
      activeHomes,
      nominationsByStatus,
      totalSponsors,
      totalMessages,
      yardSignsByStatus,
      fulfillmentsByStatus,
      activeEvent,
      totalScans,
      scansToday,
      scanRows,
      recentScans,
      recentMessages,
      ratedHomes,
    ] = await Promise.all([
      User.count(),
      User.findAll({ attributes: ["role", [User.sequelize.fn("COUNT", "*"), "count"]], group: ["role"] }),
      Home.count(),
      Home.count({ where: { isActive: true } }),
      Nomination.findAll({ attributes: ["status", [Nomination.sequelize.fn("COUNT", "*"), "count"]], group: ["status"] }),
      Sponsor.count(),
      Message.count(),
      Home.findAll({ attributes: ["yardSignStatus", [Home.sequelize.fn("COUNT", "*"), "count"]], group: ["yardSignStatus"] }),
      Fulfillment.findAll({ attributes: ["status", [Fulfillment.sequelize.fn("COUNT", "*"), "count"]], group: ["status"] }),
      Event.findOne({ where: { status: "active" } }),
      ScanEvent.count(),
      ScanEvent.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      ScanEvent.findAll({ where: { createdAt: { [Op.gte]: sevenDaysAgo } }, attributes: ["createdAt"] }),
      ScanEvent.findAll({
        order: [["createdAt", "DESC"]],
        limit: 8,
        include: [{ model: Home, as: "home", attributes: ["id", "title", "address", "slug"] }],
      }),
      Message.findAll({
        order: [["createdAt", "DESC"]],
        limit: 8,
        include: [{ model: Home, as: "home", attributes: ["id", "title", "address", "slug"] }],
      }),
      Home.findAll({ attributes: ["ratingAvg", "ratingCount"], where: { ratingCount: { [Op.gt]: 0 } } }),
    ]);

    const toMap = (rows, key) =>
      rows.reduce((acc, r) => {
        acc[r[key]] = Number(r.get("count"));
        return acc;
      }, {});

    // 7-day scan trend for the admin dashboard chart.
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      days.push(d.toISOString().slice(0, 10));
    }
    const scanCounts = {};
    scanRows.forEach((r) => {
      const key = new Date(r.createdAt).toISOString().slice(0, 10);
      scanCounts[key] = (scanCounts[key] || 0) + 1;
    });
    const scansByDay = days.map((date) => ({ date, count: scanCounts[date] || 0 }));

    // Site-wide weighted average rating (weighted by each home's rating count,
    // not a plain average of averages).
    const totalRatings = ratedHomes.reduce((sum, h) => sum + h.ratingCount, 0);
    const avgRatingSiteWide = totalRatings
      ? ratedHomes.reduce((sum, h) => sum + h.ratingAvg * h.ratingCount, 0) / totalRatings
      : 0;

    // Merged, time-sorted feed of the latest scans + messages for a live
    // "recent activity" view.
    const recentActivity = [
      ...recentScans.map((s) => ({
        type: "scan",
        homeId: s.homeId,
        homeTitle: s.home ? s.home.title || s.home.address : "Unknown home",
        homeSlug: s.home ? s.home.slug : null,
        createdAt: s.createdAt,
      })),
      ...recentMessages.map((m) => ({
        type: "message",
        homeId: m.homeId,
        homeTitle: m.home ? m.home.title || m.home.address : "Unknown home",
        homeSlug: m.home ? m.home.slug : null,
        authorName: m.authorName,
        rating: m.rating,
        createdAt: m.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        usersByRole: toMap(usersByRole, "role"),
        totalHomes,
        activeHomes,
        nominationsByStatus: toMap(nominationsByStatus, "status"),
        totalSponsors,
        totalMessages,
        yardSignsByStatus: toMap(yardSignsByStatus, "yardSignStatus"),
        fulfillmentsByStatus: toMap(fulfillmentsByStatus, "status"),
        activeEventName: activeEvent ? activeEvent.name : null,
        totalScans,
        scansToday,
        scansByDay,
        avgRatingSiteWide,
        totalRatings,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAnalytics };