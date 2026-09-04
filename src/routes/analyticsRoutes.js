const router = require("express").Router();
const { getAnalytics } = require("../controllers/analyticsController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, authorize("admin"), getAnalytics);

module.exports = router;