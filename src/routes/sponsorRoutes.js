const router = require("express").Router();
const {
  listSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  trackSponsorImpression,
  getSponsorImpressionSummary,
} = require("../controllers/sponsorController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", listSponsors);
router.get("/impressions/summary", authenticate, authorize("admin"), getSponsorImpressionSummary);
router.post("/:id/impressions", trackSponsorImpression);
router.post("/", authenticate, authorize("admin"), createSponsor);
router.patch("/:id", authenticate, authorize("admin"), updateSponsor);
router.delete("/:id", authenticate, authorize("admin"), deleteSponsor);

module.exports = router;