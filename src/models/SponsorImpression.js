"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SponsorImpression extends Model {
    static associate(models) {
      SponsorImpression.belongsTo(models.Sponsor, { foreignKey: "sponsorId", as: "sponsor" });
    }
  }

  SponsorImpression.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      sponsorId: { type: DataTypes.UUID, allowNull: false, field: "sponsor_id" },
      type: {
        type: DataTypes.ENUM("impression", "click"),
        allowNull: false,
        defaultValue: "impression",
      },
      city: { type: DataTypes.STRING(120) },
      ipHash: { type: DataTypes.STRING(64), field: "ip_hash" },
    },
    {
      sequelize,
      modelName: "SponsorImpression",
      tableName: "sponsor_impressions",
      underscored: true,
      updatedAt: false,
    }
  );

  return SponsorImpression;
};