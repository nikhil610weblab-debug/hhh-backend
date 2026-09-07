"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class HomeMedia extends Model {
    static associate(models) {
      HomeMedia.belongsTo(models.Home, { foreignKey: "homeId", as: "home" });
    }
  }

  HomeMedia.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      homeId: { type: DataTypes.UUID, allowNull: false, field: "home_id" },
      type: { type: DataTypes.ENUM("photo", "video"), allowNull: false },
      url: { type: DataTypes.STRING(500), allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: "HomeMedia",
      tableName: "home_media",
      underscored: true,
    }
  );

  return HomeMedia;
};