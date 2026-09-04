"use strict";

const ALERT_ID = "99f91e0a-bedb-485f-b4a8-cdeaac891d64";
const EVENT_ID = "8dcc89e7-2954-4ac7-bc0e-cfbb95ac78be";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("alerts", [
      {
        id: ALERT_ID,
        title: "Christmas 2026 is live!",
        body: "New homes are being added daily — check the map for fresh lights.",
        event_id: EVENT_ID,
        created_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("alerts", { id: ALERT_ID });
  },
};
