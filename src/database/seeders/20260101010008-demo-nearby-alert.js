"use strict";

const crypto = require("crypto");

const ADMIN_ID = "a1e1c1a1-0000-4000-8000-000000000001";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("nearby_alert_subscriptions", [
      {
        id: crypto.randomUUID(),
        user_id: ADMIN_ID,
        address: "Sandy Springs, GA",
        lat: 33.925,
        lng: -84.375,
        radius_miles: 10,
        is_active: true,
        last_notified_at: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("nearby_alert_subscriptions", { user_id: ADMIN_ID });
  },
};