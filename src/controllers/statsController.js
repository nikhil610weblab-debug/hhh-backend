const { Op } = require("sequelize");
const { Home, ScanEvent, Message } = require("../models");

function last14Days() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d);
  }
  return days;
}

function toDailySeries(rows, days) {
  const counts = {};
  rows.forEach((r) => {
    const key = new Date(r.createdAt).toISOString().slice(0, 10);
    counts[key] = (counts[key] || 0) + 1;
  });
  return days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: counts[key] || 0 };
  });
}

// GET /api/homes/:id/stats
// Real-time-ish stats for a single home: scans, messages, rating.
// Restricted to the home's owner or an admin.
async function getHomeStats(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });

    const isOwner = home.ownerId && home.ownerId === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "You do not have permission to view this listing's stats" });
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 13);
    since.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [totalScans, scansToday, scanRows, totalMessages, recentMessages] = await Promise.all([
      ScanEvent.count({ where: { homeId: home.id } }),
      ScanEvent.count({ where: { homeId: home.id, createdAt: { [Op.gte]: todayStart } } }),
      ScanEvent.findAll({
        where: { homeId: home.id, createdAt: { [Op.gte]: since } },
        attributes: ["createdAt"],
      }),
      Message.count({ where: { homeId: home.id } }),
      Message.findAll({
        where: { homeId: home.id },
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    res.json({
      success: true,
      stats: {
        homeId: home.id,
        totalScans,
        scansToday,
        scansByDay: toDailySeries(scanRows, last14Days()),
        totalMessages,
        ratingAvg: home.ratingAvg,
        ratingCount: home.ratingCount,
        recentMessages,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHomeStats };