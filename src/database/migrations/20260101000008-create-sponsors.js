"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sponsors", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(160), allowNull: false },
      logo_url: { type: Sequelize.STRING(500) },
      url: { type: Sequelize.STRING(500) },
      tier: {
        type: Sequelize.ENUM("local", "gold", "platinum"),
        allowNull: false,
        defaultValue: "local",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("sponsors");
  },
};
