const router = require("express").Router();
const { trackScan } = require("../controllers/scanController");

// Public: fired by the client when a visitor lands on a home via QR/link.
router.post("/", trackScan);

module.exports = router;