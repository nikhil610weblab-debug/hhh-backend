"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Home, { foreignKey: "homeId", as: "home" });
      Message.belongsTo(models.User, { foreignKey: "authorId", as: "author" });
    }
  }

  Message.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      homeId: { type: DataTypes.UUID, allowNull: false, field: "home_id" },
      authorId: { type: DataTypes.UUID, field: "author_id" },
      authorName: { type: DataTypes.STRING(120), allowNull: false, defaultValue: "Guest", field: "author_name" },
      visitorId: { type: DataTypes.STRING(64), field: "visitor_id" },
      body: { type: DataTypes.TEXT, allowNull: false },
      rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
      rating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 } },
      favorited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      underscored: true,
      updatedAt: false,
    }
  );

  return Message;
};
