const router = require("express").Router();
const { claimHiddenIconXp } = require("../controllers/gameController");
const { authenticate } = require("../middleware/auth");

router.post("/hidden-icon/claim", authenticate, claimHiddenIconXp);

module.exports = router;