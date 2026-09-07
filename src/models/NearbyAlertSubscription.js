"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class NearbyAlertSubscription extends Model {
    static associate(models) {
      NearbyAlertSubscription.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  }

  NearbyAlertSubscription.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
      address: { type: DataTypes.STRING(255), allowNull: false },
      lat: { type: DataTypes.DOUBLE, allowNull: false },
      lng: { type: DataTypes.DOUBLE, allowNull: false },
      radiusMiles: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 10, field: "radius_miles" },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
      lastNotifiedAt: { type: DataTypes.DATE, allowNull: true, field: "last_notified_at" },
    },
    {
      sequelize,
      modelName: "NearbyAlertSubscription",
      tableName: "nearby_alert_subscriptions",
      underscored: true,
    }
  );

  return NearbyAlertSubscription;
};