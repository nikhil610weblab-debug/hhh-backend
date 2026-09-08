const router = require("express").Router();
const { createNomination, listNominations, reviewNomination } = require("../controllers/nominationController");
const { authenticate, authorize, optionalAuthenticate } = require("../middleware/auth");

router.get("/", authenticate, authorize("admin"), listNominations);
router.post("/", optionalAuthenticate, createNomination);
router.patch("/:id", authenticate, authorize("admin"), reviewNomination);

module.exports = router;