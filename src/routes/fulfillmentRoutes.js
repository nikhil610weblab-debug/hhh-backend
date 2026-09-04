const router = require("express").Router();
const {
  listFulfillments,
  createFulfillment,
  updateFulfillment,
  deleteFulfillment,
} = require("../controllers/fulfillmentController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("admin"));

router.get("/", listFulfillments);
router.post("/", createFulfillment);
router.patch("/:id", updateFulfillment);
router.delete("/:id", deleteFulfillment);

module.exports = router;