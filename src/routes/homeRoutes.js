const router = require("express").Router();
const {
  listHomes,
  getHome,
  getHomeBySlug,
  getMyHomes,
  createHome,
  updateHome,
  requestHomeClaim,
  verifyHomeClaim,
} = require("../controllers/homeController");
const { getHomeStats } = require("../controllers/statsController");
const { authenticate, authorize } = require("../middleware/auth");

// Specific routes must come before the `/:id` catch-all below.
router.get("/mine", authenticate, getMyHomes);
router.get("/slug/:slug", getHomeBySlug);
router.get("/:id/stats", authenticate, getHomeStats);

router.get("/", listHomes);
router.get("/:id", getHome);
router.post("/", authenticate, authorize("homeowner", "admin"), createHome);
router.post("/:id/claim/request", authenticate, authorize("homeowner", "admin"), requestHomeClaim);
router.post("/:id/claim/verify", authenticate, authorize("homeowner", "admin"), verifyHomeClaim);
// Ownership is checked inside the controller (owner or admin).
router.patch("/:id", authenticate, authorize("homeowner", "admin"), updateHome);

module.exports = router;