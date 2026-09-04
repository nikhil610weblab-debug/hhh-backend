const router = require("express").Router();
const {
  register,
  login,
  googleAuth,
  me,
  logout,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

module.exports = router;