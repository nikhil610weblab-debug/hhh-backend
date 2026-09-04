"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tour_stops", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      tour_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "tours", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      home_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "homes", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      order: { type: Sequelize.INTEGER, allowNull: false },
      distance_mi: { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 },
      drive_min: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("tour_stops", ["tour_id"]);
    await queryInterface.addIndex("tour_stops", ["home_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tour_stops");
  },
};
