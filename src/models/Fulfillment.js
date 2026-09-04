"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Fulfillment extends Model {
    static associate(models) {
      Fulfillment.belongsTo(models.Home, { foreignKey: "homeId", as: "home" });
      Fulfillment.belongsTo(models.Nomination, { foreignKey: "nominationId", as: "nomination" });
    }
  }

  Fulfillment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      recipientName: { type: DataTypes.STRING(160), allowNull: false, field: "recipient_name" },
      recipientEmail: { type: DataTypes.STRING(255), field: "recipient_email" },
      item: { type: DataTypes.STRING(200), allowNull: false },
      status: {
        type: DataTypes.ENUM("pending", "shipped", "delivered"),
        allowNull: false,
        defaultValue: "pending",
      },
      notes: { type: DataTypes.TEXT },
      homeId: { type: DataTypes.UUID, field: "home_id" },
      nominationId: { type: DataTypes.UUID, field: "nomination_id" },
    },
    {
      sequelize,
      modelName: "Fulfillment",
      tableName: "fulfillments",
      underscored: true,
    }
  );

  return Fulfillment;
};