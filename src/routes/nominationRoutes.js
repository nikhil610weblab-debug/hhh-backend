const router = require("express").Router();
const { createNomination, listNominations, reviewNomination } = require("../controllers/nominationController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, authorize("admin"), listNominations);
router.post("/", authenticate, createNomination);
router.patch("/:id", authenticate, authorize("admin"), reviewNomination);

module.exports = router;