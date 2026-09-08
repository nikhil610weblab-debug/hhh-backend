"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Lets an anonymous guest's rating be recognized across visits so it
    // can be excluded from duplicate-counting in the home's rating average.
    // Logged-in users are identified by author_id instead; this is only
    // populated for guests.
    await queryInterface.addColumn("messages", "visitor_id", {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("messages", "visitor_id");
  },
};