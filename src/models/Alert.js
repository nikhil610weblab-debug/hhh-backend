"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Alert extends Model {
    static associate(models) {
      Alert.belongsTo(models.Event, { foreignKey: "eventId", as: "event" });
    }
  }

  Alert.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      title: { type: DataTypes.STRING(180), allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      eventId: { type: DataTypes.UUID, field: "event_id" },
    },
    {
      sequelize,
      modelName: "Alert",
      tableName: "alerts",
      underscored: true,
      updatedAt: false,
    }
  );

  return Alert;
};
