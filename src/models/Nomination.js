"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Nomination extends Model {
    static associate(models) {
      Nomination.belongsTo(models.User, { foreignKey: "nominatorId", as: "nominator" });
      Nomination.belongsTo(models.User, { foreignKey: "reviewerId", as: "reviewer" });
      Nomination.belongsTo(models.Home, { foreignKey: "homeId", as: "home" });
      Nomination.hasMany(models.Fulfillment, { foreignKey: "nominationId", as: "fulfillments" });
    }
  }

  Nomination.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      address: { type: DataTypes.STRING(255), allowNull: false },
      lat: { type: DataTypes.DOUBLE },
      lng: { type: DataTypes.DOUBLE },
      notes: { type: DataTypes.TEXT },
      photoUrl: { type: DataTypes.STRING(500), field: "photo_url" },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      nominatorId: { type: DataTypes.UUID, field: "nominator_id" },
      reviewerId: { type: DataTypes.UUID, field: "reviewer_id" },
      homeId: { type: DataTypes.UUID, field: "home_id" },
      reviewedAt: { type: DataTypes.DATE, field: "reviewed_at" },
    },
    {
      sequelize,
      modelName: "Nomination",
      tableName: "nominations",
      underscored: true,
      updatedAt: false,
    }
  );

  return Nomination;
};