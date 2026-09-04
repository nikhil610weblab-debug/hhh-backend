"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Separate from isActive: isActive gates whether the home functions at
    // all (owner deactivated / event over). isListed only controls whether
    // the home shows up on the public map — the QR code / direct link page
    // stays live either way, since a homeowner may want to stop walk-up
    // traffic without breaking a sign that's already printed and posted.
    await queryInterface.addColumn("homes", "is_listed", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("homes", "is_listed");
  },
};