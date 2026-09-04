const router = require("express").Router();
const { listMessages, createMessage } = require("../controllers/messageController");
const { optionalAuthenticate } = require("../middleware/auth");

router.get("/", listMessages);
router.post("/", optionalAuthenticate, createMessage);

module.exports = router;