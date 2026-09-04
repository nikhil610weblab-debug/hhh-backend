const router = require("express").Router();
const {
    listEvents,
    getActiveEvent,
    createEvent,
    updateEvent,
    activateEvent,
} = require("../controllers/eventController");
const { authenticate, authorize } = require("../middleware/auth");

// Specific routes must come before the `/:id` catch-all below.
router.get("/active", getActiveEvent);

router.get("/", listEvents);
router.post("/", authenticate, authorize("admin"), createEvent);
router.patch("/:id", authenticate, authorize("admin"), updateEvent);
router.patch("/:id/activate", authenticate, authorize("admin"), activateEvent);

module.exports = router;