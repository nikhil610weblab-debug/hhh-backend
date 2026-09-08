const router = require("express").Router();
const { listMessages, createMessage, toggleMessageFavorite } = require("../controllers/messageController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

router.get("/", listMessages);
router.post("/", optionalAuthenticate, createMessage);
router.patch("/:id", authenticate, toggleMessageFavorite);

module.exports = router;