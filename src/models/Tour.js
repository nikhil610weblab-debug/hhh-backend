"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Tour extends Model {
    static associate(models) {
      Tour.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Tour.hasMany(models.TourStop, { foreignKey: "tourId", as: "stops", onDelete: "CASCADE" });
    }
  }

  Tour.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(180), allowNull: false, defaultValue: "My Holiday Tour" },
      userId: { type: DataTypes.UUID, field: "user_id" },
    },
    {
      sequelize,
      modelName: "Tour",
      tableName: "tours",
      underscored: true,
      updatedAt: false,
    }
  );

  return Tour;
};
