"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("homes", "listing_hours", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("homes", "thank_you_note", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("homes", "charity_name", {
      type: Sequelize.STRING(180),
      allowNull: true,
    });

    await queryInterface.addColumn("homes", "charity_link", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("homes", "charity_link");
    await queryInterface.removeColumn("homes", "charity_name");
    await queryInterface.removeColumn("homes", "thank_you_note");
    await queryInterface.removeColumn("homes", "listing_hours");
  },
};