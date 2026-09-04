"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("events", "theme", {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: "christmas",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("events", "theme");
  },
};