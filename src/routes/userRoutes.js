const router = require("express").Router();
const { listUsers, getUser, updateUserRole, deleteUser } = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("admin"));

router.get("/", listUsers);
router.get("/:id", getUser);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

module.exports = router;