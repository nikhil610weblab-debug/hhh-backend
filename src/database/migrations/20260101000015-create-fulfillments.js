"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fulfillments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      recipient_name: { type: Sequelize.STRING(160), allowNull: false },
      recipient_email: { type: Sequelize.STRING(255), allowNull: true },
      item: { type: Sequelize.STRING(200), allowNull: false },
      status: {
        type: Sequelize.ENUM("pending", "shipped", "delivered"),
        allowNull: false,
        defaultValue: "pending",
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      home_id: {
        type: Sequelize.UUID,
        references: { model: "homes", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      nomination_id: {
        type: Sequelize.UUID,
        references: { model: "nominations", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("fulfillments", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fulfillments");
  },
};