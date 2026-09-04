"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // We store a SHA-256 hash of the reset token, never the raw token — so
    // a DB leak alone can't be used to reset anyone's password (same reason
    // passwordHash isn't the raw password).
    await queryInterface.addColumn("users", "reset_token_hash", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "reset_token_expires_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "reset_token_hash");
    await queryInterface.removeColumn("users", "reset_token_expires_at");
  },
};