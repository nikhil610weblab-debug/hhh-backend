"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("events", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      icon: { type: Sequelize.STRING(80), allowNull: false, defaultValue: "tree" },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM("active", "upcoming", "ended"),
        allowNull: false,
        defaultValue: "upcoming",
      },
      cover_url: { type: Sequelize.STRING(500) },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("events");
  },
};
