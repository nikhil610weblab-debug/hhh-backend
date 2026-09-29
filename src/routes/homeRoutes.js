const router = require("express").Router();
const {
  listHomes,
  getHome,
  getHomeBySlug,
  getMyHomes,
  createHome,
  updateHome,
  generateHomeClaimCode,
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

router.post("/", authenticate, authorize("homeowner", "admin"), createHome);

// Claim: admin generates the code, homeowner verifies with it.
router.post("/:id/claim/generate", authenticate, authorize("admin"), generateHomeClaimCode);
router.post("/:id/claim/verify", authenticate, authorize("homeowner", "admin"), verifyHomeClaim);

// Ownership is checked inside the controller (owner or admin).
router.patch("/:id", authenticate, authorize("homeowner", "admin"), updateHome);

module.exports = router;