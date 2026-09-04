"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("homes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      address: { type: Sequelize.STRING(255), allowNull: false },
      city: { type: Sequelize.STRING(120), allowNull: false },
      state: { type: Sequelize.STRING(120), allowNull: false },
      lat: { type: Sequelize.DOUBLE, allowNull: false },
      lng: { type: Sequelize.DOUBLE, allowNull: false },
      title: { type: Sequelize.STRING(180) },
      description: { type: Sequelize.TEXT },
      photo_url: { type: Sequelize.STRING(500) },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      rating_avg: { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 0 },
      rating_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      slug: { type: Sequelize.STRING(220), allowNull: false, unique: true },
      owner_id: {
        type: Sequelize.UUID,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      event_id: {
        type: Sequelize.UUID,
        references: { model: "events", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("homes", ["city"]);
    await queryInterface.addIndex("homes", ["event_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("homes");
  },
};
