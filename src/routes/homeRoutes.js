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
const {
  listHomeMedia,
  uploadHomeMedia,
  deleteHomeMedia,
  reorderHomeMedia,
} = require("../controllers/homeMediaController");
const { getHomeStats } = require("../controllers/statsController");
const { authenticate, authorize, optionalAuthenticate } = require("../middleware/auth");
const { homeMediaUpload } = require("../utils/upload");

// Specific routes must come before the `/:id` catch-all below.
router.get("/mine", authenticate, getMyHomes);
router.get("/slug/:slug", getHomeBySlug);
router.get("/:id/stats", authenticate, getHomeStats);
router.get("/", optionalAuthenticate, listHomes);
router.get("/:id", optionalAuthenticate, getHome);

// Media gallery — up to 20 photos + 5 videos per home.
router.get("/:id/media", listHomeMedia);
router.post(
  "/:id/media",
  authenticate,
  authorize("homeowner", "admin"),
  homeMediaUpload.array("files", 25),
  uploadHomeMedia
);
router.delete("/:id/media/:mediaId", authenticate, authorize("homeowner", "admin"), deleteHomeMedia);
router.patch("/:id/media/reorder", authenticate, authorize("homeowner", "admin"), reorderHomeMedia);

router.get("/", listHomes);
router.get("/:id", getHome);
router.post("/", authenticate, authorize("homeowner", "admin"), createHome);
router.post("/:id/claim/request", authenticate, authorize("homeowner", "admin"), requestHomeClaim);
router.post("/:id/claim/verify", authenticate, authorize("homeowner", "admin"), verifyHomeClaim);
// Ownership is checked inside the controller (owner or admin).
router.patch("/:id", authenticate, authorize("homeowner", "admin"), updateHome);

module.exports = router;