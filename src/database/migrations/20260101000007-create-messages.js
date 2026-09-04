"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("messages", {
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
      author_id: {
        type: Sequelize.UUID,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      author_name: { type: Sequelize.STRING(120), allowNull: false, defaultValue: "Guest" },
      body: { type: Sequelize.TEXT, allowNull: false },
      rating: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("messages", ["home_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("messages");
  },
};
