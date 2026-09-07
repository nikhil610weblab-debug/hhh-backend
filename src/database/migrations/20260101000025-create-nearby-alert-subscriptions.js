"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("nearby_alert_subscriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      address: { type: Sequelize.STRING(255), allowNull: false },
      lat: { type: Sequelize.DOUBLE, allowNull: false },
      lng: { type: Sequelize.DOUBLE, allowNull: false },
      radius_miles: { type: Sequelize.DOUBLE, allowNull: false, defaultValue: 10 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      last_notified_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("nearby_alert_subscriptions", ["user_id"]);
    await queryInterface.addIndex("nearby_alert_subscriptions", ["is_active"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("nearby_alert_subscriptions");
  },
};