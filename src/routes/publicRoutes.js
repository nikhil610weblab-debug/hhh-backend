const router = require("express").Router();
const { Alert } = require("../models");

router.get("/alerts", async (req, res, next) => {
  try {
    const alerts = await Alert.findAll({ order: [["createdAt", "DESC"]], limit: 10 });
    res.json({ success: true, alerts });
  } catch (error) { next(error); }
});

module.exports = router;