"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("scan_events", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      home_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "homes", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      source: {
        type: Sequelize.ENUM("qr", "link", "other"),
        allowNull: false,
        defaultValue: "qr",
      },
      ip_hash: { type: Sequelize.STRING(64) },
      user_agent: { type: Sequelize.STRING(255) },
      referrer: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("scan_events", ["home_id"]);
    await queryInterface.addIndex("scan_events", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("scan_events");
  },
};