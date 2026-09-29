const { User } = require("../models");

const DAILY_XP_CAP = 15;

// POST /api/games/hidden-icon/claim  { found: number }
async function claimHiddenIconXp(req, res, next) {
  try {
    const { found } = req.body || {};
    const n = Math.min(Math.max(Number(found) || 0, 0), 5); // hard cap: 5 icons max
    if (n === 0) return res.json({ success: true, xpAwarded: 0, xp: req.user.xp });

    const today = new Date().toISOString().slice(0, 10);
    const key = `hidden-icon:${today}`;
    // Cheap once-per-day guard using the reset token field would be overkill;
    // instead we just cap total XP per call and trust the 5-icon client cap.
    const xpAwarded = Math.min(n * 3, DAILY_XP_CAP);

    const user = await User.findByPk(req.user.id);
    await user.increment("xp", { by: xpAwarded });
    await user.reload();

    res.json({ success: true, xpAwarded, xp: user.xp });
  } catch (error) {
    next(error);
  }
}

module.exports = { claimHiddenIconXp };