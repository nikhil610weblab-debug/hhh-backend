"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lets a homeowner "heart" a visitor's message on their dashboard —
    // purely cosmetic (surfaces favorites first), doesn't affect ratingAvg.
    await queryInterface.addColumn("messages", "favorited", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("messages", "favorited");
  },
};