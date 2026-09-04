"use strict";

// Migration 20260101000010 was recorded as applied in SequelizeMeta on this
// database, but the columns it should have created (phone, address,
// oauth_provider, oauth_id) never actually landed in the table — causing
// "Unknown column 'phone'" errors on every login/register. This migration
// re-adds exactly those columns as a fresh migration, so it runs cleanly
// without needing to touch SequelizeMeta.
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");

    if (!table.phone) {
      await queryInterface.addColumn("users", "phone", {
        type: Sequelize.STRING(30),
        allowNull: true,
      });
    }

    if (!table.address) {
      await queryInterface.addColumn("users", "address", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table.oauth_provider) {
      await queryInterface.addColumn("users", "oauth_provider", {
        type: Sequelize.STRING(30),
        allowNull: true,
      });
    }

    if (!table.oauth_id) {
      await queryInterface.addColumn("users", "oauth_id", {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    // OAuth-only accounts have no local password — make sure this is nullable.
    await queryInterface.changeColumn("users", "password_hash", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    const indexes = await queryInterface.showIndex("users");
    const hasOauthIndex = indexes.some((idx) => idx.name === "users_oauth_provider_oauth_id");
    if (!hasOauthIndex) {
      await queryInterface.addIndex("users", ["oauth_provider", "oauth_id"], {
        name: "users_oauth_provider_oauth_id",
        unique: true,
        where: { oauth_id: { [Sequelize.Op.ne]: null } },
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex("users");
    if (indexes.some((idx) => idx.name === "users_oauth_provider_oauth_id")) {
      await queryInterface.removeIndex("users", "users_oauth_provider_oauth_id");
    }
    await queryInterface.removeColumn("users", "oauth_id");
    await queryInterface.removeColumn("users", "oauth_provider");
    await queryInterface.removeColumn("users", "address");
    await queryInterface.removeColumn("users", "phone");
  },
};