"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Home, { foreignKey: "ownerId", as: "homes" });
      User.hasMany(models.Nomination, { foreignKey: "nominatorId", as: "nominations" });
      User.hasMany(models.Tour, { foreignKey: "userId", as: "tours" });
      User.hasMany(models.Message, { foreignKey: "authorId", as: "messages" });
      User.hasMany(models.NearbyAlertSubscription, { foreignKey: "userId", as: "nearbyAlertSubscriptions", onDelete: "CASCADE" });
    }
  }

  User.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
      passwordHash: { type: DataTypes.STRING(255), allowNull: true, field: "password_hash" },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      address: { type: DataTypes.STRING(255), allowNull: true },
      oauthProvider: { type: DataTypes.STRING(30), allowNull: true, field: "oauth_provider" },
      oauthId: { type: DataTypes.STRING(255), allowNull: true, field: "oauth_id" },
      role: { type: DataTypes.ENUM("viewer", "homeowner", "admin"), allowNull: false, defaultValue: "viewer" },
      xp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      resetTokenHash: { type: DataTypes.STRING(64), allowNull: true, field: "reset_token_hash" },
      resetTokenExpiresAt: { type: DataTypes.DATE, allowNull: true, field: "reset_token_expires_at" },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      underscored: true,
    }
  );

  return User;
};