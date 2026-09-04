const { Op } = require("sequelize");
const { User, Home, Nomination } = require("../models");

const ROLES = ["viewer", "homeowner", "admin"];

// Admin-only: GET /api/users?role=&q=
async function listUsers(req, res, next) {
  try {
    const { role, q } = req.query;
    const where = {};
    if (role && ROLES.includes(role)) where.role = role;
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ["passwordHash"] },
      order: [["createdAt", "DESC"]],
      limit: 200,
    });

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
}

// Admin-only: GET /api/users/:id
async function getUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["passwordHash"] },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const [homes, nominations] = await Promise.all([
      Home.findAll({ where: { ownerId: user.id }, attributes: ["id", "address", "city", "slug"] }),
      Nomination.findAll({ where: { nominatorId: user.id }, attributes: ["id", "address", "status"] }),
    ]);

    res.json({ success: true, user, homes, nominations });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/users/:id/role  { role }
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body || {};
    if (!ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `role must be one of: ${ROLES.join(", ")}` });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (user.id === req.user.id && role !== "admin") {
      return res.status(400).json({ success: false, error: "You can't remove your own admin access" });
    }

    await user.update({ role });
    res.json({ success: true, user: { ...user.toJSON(), passwordHash: undefined } });
  } catch (error) {
    next(error);
  }
}

// Admin-only: DELETE /api/users/:id
async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: "You can't delete your own account" });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    await user.destroy();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, getUser, updateUserRole, deleteUser };