"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Home extends Model {
    static associate(models) {
      Home.belongsTo(models.User, { foreignKey: "ownerId", as: "owner" });
      Home.belongsTo(models.Event, { foreignKey: "eventId", as: "event" });
      Home.hasMany(models.TourStop, { foreignKey: "homeId", as: "tourStops" });
      Home.hasMany(models.Message, { foreignKey: "homeId", as: "messages", onDelete: "CASCADE" });
      Home.hasOne(models.Nomination, { foreignKey: "homeId", as: "sourceNomination" });
      Home.hasMany(models.Fulfillment, { foreignKey: "homeId", as: "fulfillments" });
      Home.hasMany(models.ScanEvent, { foreignKey: "homeId", as: "scans", onDelete: "CASCADE" });
      Home.hasMany(models.HomeMedia, { foreignKey: "homeId", as: "media", onDelete: "CASCADE" });
    }
  }

  Home.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      address: { type: DataTypes.STRING(255), allowNull: false },
      city: { type: DataTypes.STRING(120), allowNull: false },
      state: { type: DataTypes.STRING(120), allowNull: false },
      lat: { type: DataTypes.DOUBLE, allowNull: false },
      lng: { type: DataTypes.DOUBLE, allowNull: false },
      title: { type: DataTypes.STRING(180) },
      description: { type: DataTypes.TEXT },
      photoUrl: { type: DataTypes.STRING(500), field: "photo_url" },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
      ratingAvg: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0, field: "rating_avg" },
      ratingCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "rating_count" },
      slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
      ownerId: { type: DataTypes.UUID, field: "owner_id" },
      eventId: { type: DataTypes.UUID, field: "event_id" },
      // Homeowner-editable extras — shown on the public listing page.
      listingHours: { type: DataTypes.STRING(255), field: "listing_hours" },
      thankYouNote: { type: DataTypes.TEXT, field: "thank_you_note" },
      charityName: { type: DataTypes.STRING(180), field: "charity_name" },
      charityLink: { type: DataTypes.STRING(500), field: "charity_link" },
      // Yard-sign fulfillment tracking (admin-managed).
      yardSignStatus: {
        type: DataTypes.ENUM("requested", "printed", "delivered"),
        allowNull: false,
        defaultValue: "requested",
        field: "yard_sign_status",
      },
      yardSignRequestedAt: { type: DataTypes.DATE, field: "yard_sign_requested_at" },
      yardSignPrintedAt: { type: DataTypes.DATE, field: "yard_sign_printed_at" },
      yardSignDeliveredAt: { type: DataTypes.DATE, field: "yard_sign_delivered_at" },
      claimCodeHash: { type: DataTypes.STRING(64), allowNull: true, field: "claim_code_hash" },
      claimCodeExpiresAt: { type: DataTypes.DATE, allowNull: true, field: "claim_code_expires_at" },
      claimRequestedBy: { type: DataTypes.UUID, allowNull: true, field: "claim_requested_by" },
    },
    {
      sequelize,
      modelName: "Home",
      tableName: "homes",
      underscored: true,
    }
  );

  return Home;
};