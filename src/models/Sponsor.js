"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Sponsor extends Model {
    static associate(models) {
      Sponsor.hasMany(models.SponsorImpression, { foreignKey: "sponsorId", as: "impressions" });
    }
  }

  Sponsor.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(160), allowNull: false },
      logoUrl: { type: DataTypes.STRING(500), field: "logo_url" },
      url: { type: DataTypes.STRING(500) },
      tier: { type: DataTypes.ENUM("local", "gold", "platinum"), allowNull: false, defaultValue: "local" },
      // Nullable — null means "general/national sponsor", shown everywhere
      // as a fallback when no sponsor matches the visitor's detected city.
      city: { type: DataTypes.STRING(120) },
    },
    {
      sequelize,
      modelName: "Sponsor",
      tableName: "sponsors",
      underscored: true,
      updatedAt: false,
    }
  );

  return Sponsor;
};
