"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("home_media", {
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
      type: {
        type: Sequelize.ENUM("photo", "video"),
        allowNull: false,
      },
      url: { type: Sequelize.STRING(500), allowNull: false },
      position: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("home_media", ["home_id"]);
    await queryInterface.addIndex("home_media", ["home_id", "type"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("home_media");
  },
};