const router = require("express").Router();
const { listYardSigns, updateYardSignStatus, requestReplacement } = require("../controllers/yardSignController");
const { authenticate, authorize } = require("../middleware/auth");

// Homeowner or admin — ownership is checked inside the controller.
router.post("/:homeId/replacement-request", authenticate, requestReplacement);

// Admin-only.
router.get("/", authenticate, authorize("admin"), listYardSigns);
router.patch("/:homeId", authenticate, authorize("admin"), updateYardSignStatus);

module.exports = router;