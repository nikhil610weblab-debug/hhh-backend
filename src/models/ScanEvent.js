"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ScanEvent extends Model {
    static associate(models) {
      ScanEvent.belongsTo(models.Home, { foreignKey: "homeId", as: "home" });
    }
  }

  ScanEvent.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      homeId: { type: DataTypes.UUID, allowNull: false, field: "home_id" },
      source: {
        type: DataTypes.ENUM("qr", "link", "other"),
        allowNull: false,
        defaultValue: "qr",
      },
      ipHash: { type: DataTypes.STRING(64), field: "ip_hash" },
      userAgent: { type: DataTypes.STRING(255), field: "user_agent" },
      referrer: { type: DataTypes.STRING(255) },
    },
    {
      sequelize,
      modelName: "ScanEvent",
      tableName: "scan_events",
      underscored: true,
      updatedAt: false,
    }
  );

  return ScanEvent;
};