"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      Event.hasMany(models.Home, { foreignKey: "eventId", as: "homes" });
      Event.hasMany(models.Alert, { foreignKey: "eventId", as: "alerts" });
    }
  }

  Event.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(160), allowNull: false },
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      icon: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "tree" },
      startDate: { type: DataTypes.DATE, allowNull: false, field: "start_date" },
      endDate: { type: DataTypes.DATE, allowNull: false, field: "end_date" },
      status: {
        type: DataTypes.ENUM("active", "upcoming", "ended"),
        allowNull: false,
        defaultValue: "upcoming",
      },
      coverUrl: { type: DataTypes.STRING(500), field: "cover_url" },
      theme: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "christmas" },
      primaryColor: { type: DataTypes.STRING(7), allowNull: true, field: "primary_color" },
      secondaryColor: { type: DataTypes.STRING(7), allowNull: true, field: "secondary_color" },
      accentColor: { type: DataTypes.STRING(7), allowNull: true, field: "accent_color" },
    },
    {
      sequelize,
      modelName: "Event",
      tableName: "events",
      underscored: true,
      updatedAt: false,
    }
  );

  return Event;
};
