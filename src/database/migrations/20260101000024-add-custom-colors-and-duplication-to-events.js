"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Nullable — when unset, the frontend falls back to the theme preset's
    // colors. Setting these lets an admin override just the 3 brand colors
    // without having to define a whole new theme preset in code.
    await queryInterface.addColumn("events", "primary_color", {
      type: Sequelize.STRING(7),
      allowNull: true,
    });
    await queryInterface.addColumn("events", "secondary_color", {
      type: Sequelize.STRING(7),
      allowNull: true,
    });
    await queryInterface.addColumn("events", "accent_color", {
      type: Sequelize.STRING(7),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("events", "accent_color");
    await queryInterface.removeColumn("events", "secondary_color");
    await queryInterface.removeColumn("events", "primary_color");
  },
};