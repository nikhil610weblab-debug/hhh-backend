"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Nullable: a sponsor with no city is a "national"/general sponsor shown
    // everywhere as a fallback when no city-specific sponsor matches.
    await queryInterface.addColumn("sponsors", "city", {
      type: Sequelize.STRING(120),
      allowNull: true,
    });
    await queryInterface.addIndex("sponsors", ["city"]);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("sponsors", "city");
  },
};