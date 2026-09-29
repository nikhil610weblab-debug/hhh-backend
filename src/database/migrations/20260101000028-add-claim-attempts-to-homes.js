"use strict";
module.exports = {
  async up(q, Sequelize) {
    await q.addColumn("homes", "claim_attempts", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(q) {
    await q.removeColumn("homes", "claim_attempts");
  },
};