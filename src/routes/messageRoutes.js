const router = require("express").Router();

const { listMessages, createMessage, toggleMessageFavorite, listRecentMessages } = require("../controllers/messageController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

router.get("/recent", listRecentMessages); // must come before "/"
router.get("/", listMessages);
router.post("/", optionalAuthenticate, createMessage);
router.patch("/:id", authenticate, toggleMessageFavorite);

module.exports = router;