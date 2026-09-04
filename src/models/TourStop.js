"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TourStop extends Model {
    static associate(models) {
      TourStop.belongsTo(models.Tour, { foreignKey: "tourId", as: "tour" });
      TourStop.belongsTo(models.Home, { foreignKey: "homeId", as: "home" });
    }
  }

  TourStop.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tourId: { type: DataTypes.UUID, allowNull: false, field: "tour_id" },
      homeId: { type: DataTypes.UUID, allowNull: false, field: "home_id" },
      order: { type: DataTypes.INTEGER, allowNull: false },
      distanceMi: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0, field: "distance_mi" },
      driveMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "drive_min" },
    },
    {
      sequelize,
      modelName: "TourStop",
      tableName: "tour_stops",
      underscored: true,
      updatedAt: false,
    }
  );

  return TourStop;
};
