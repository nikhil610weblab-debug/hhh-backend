"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("homes", "yard_sign_status", {
      type: Sequelize.ENUM("requested", "printed", "delivered"),
      allowNull: false,
      defaultValue: "requested",
    });

    await queryInterface.addColumn("homes", "yard_sign_requested_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("homes", "yard_sign_printed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("homes", "yard_sign_delivered_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("homes", "yard_sign_delivered_at");
    await queryInterface.removeColumn("homes", "yard_sign_printed_at");
    await queryInterface.removeColumn("homes", "yard_sign_requested_at");
    await queryInterface.removeColumn("homes", "yard_sign_status");
  },
};