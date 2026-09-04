"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Same pattern as the password-reset tokens: we store a hash of the
    // code, never the raw value, so a DB leak alone can't be used to claim
    // homes. One active code per home at a time — a new request overwrites
    // the previous one, invalidating it.
    await queryInterface.addColumn("homes", "claim_code_hash", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
    await queryInterface.addColumn("homes", "claim_code_expires_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("homes", "claim_requested_by", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("homes", "claim_requested_by");
    await queryInterface.removeColumn("homes", "claim_code_expires_at");
    await queryInterface.removeColumn("homes", "claim_code_hash");
  },
};