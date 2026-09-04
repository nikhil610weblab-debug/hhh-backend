"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("nominations", "home_id", {
      type: Sequelize.UUID,
      references: { model: "homes", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("nominations", "reviewer_id", {
      type: Sequelize.UUID,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("nominations", "reviewed_at", {
      type: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("nominations", "home_id");
    await queryInterface.removeColumn("nominations", "reviewer_id");
    await queryInterface.removeColumn("nominations", "reviewed_at");
  },
};
