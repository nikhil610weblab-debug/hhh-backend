"use strict";

const EVENT_ID = "8dcc89e7-2954-4ac7-bc0e-cfbb95ac78be";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("events", [
      {
        id: EVENT_ID,
        name: "Christmas 2026",
        slug: "christmas-2026",
        icon: "tree",
        start_date: new Date("2026-11-15"),
        end_date: new Date("2026-12-31"),
        status: "active",
        cover_url: null,
        created_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("events", { id: EVENT_ID });
  },
};
