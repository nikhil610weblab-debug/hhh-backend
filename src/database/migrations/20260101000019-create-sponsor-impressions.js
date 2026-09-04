"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sponsor_impressions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      sponsor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "sponsors", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      type: {
        type: Sequelize.ENUM("impression", "click"),
        allowNull: false,
        defaultValue: "impression",
      },
      city: { type: Sequelize.STRING(120) },
      ip_hash: { type: Sequelize.STRING(64) },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("sponsor_impressions", ["sponsor_id"]);
    await queryInterface.addIndex("sponsor_impressions", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sponsor_impressions");
  },
};