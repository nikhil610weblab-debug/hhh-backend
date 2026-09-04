"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "phone", {
      type: Sequelize.STRING(30),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "address", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "oauth_provider", {
      type: Sequelize.STRING(30),
      allowNull: true,
    });

    await queryInterface.addColumn("users", "oauth_id", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    // OAuth-only accounts have no local password
    await queryInterface.changeColumn("users", "password_hash", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addIndex("users", ["oauth_provider", "oauth_id"], {
      name: "users_oauth_provider_oauth_id",
      unique: true,
      where: { oauth_id: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_oauth_provider_oauth_id");
    await queryInterface.removeColumn("users", "oauth_id");
    await queryInterface.removeColumn("users", "oauth_provider");
    await queryInterface.removeColumn("users", "address");
    await queryInterface.removeColumn("users", "phone");
    await queryInterface.changeColumn("users", "password_hash", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};
