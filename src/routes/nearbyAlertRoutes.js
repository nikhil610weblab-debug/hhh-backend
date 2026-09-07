const router = require("express").Router();
const {
  listMySubscriptions,
  createSubscription,
  deleteSubscription,
} = require("../controllers/nearbyAlertController");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, listMySubscriptions);
router.post("/", authenticate, createSubscription);
router.delete("/:id", authenticate, deleteSubscription);

module.exports = router;