"use strict";

const crypto = require("crypto");

// A few of the demo homes from 20260101010002-demo-homes.js.
const HOME_IDS = [
  "b60534c9-41f3-45a1-8826-27f6d2586c12", // 123 Maple Street
  "b5b62599-d6e0-4262-bfd8-489438663237", // 456 Oak Avenue
  "be9b9cc7-d60b-4ca1-b44c-3d99c78222ea", // 789 Pine Road
];

const PHOTOS_PER_HOME = 4;

// Freely-embeddable CC0 sample clips (MDN) — no local files needed.
const VIDEO_URLS = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/coffee.mp4",
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = [];

    HOME_IDS.forEach((homeId, homeIndex) => {
      for (let i = 0; i < PHOTOS_PER_HOME; i++) {
        rows.push({
          id: crypto.randomUUID(),
          home_id: homeId,
          type: "photo",
          // picsum.photos returns a stable image per seed string, so each
          // home + slot gets its own consistent placeholder photo.
          url: `https://picsum.photos/seed/hhh-${homeIndex}-${i}/800/800`,
          position: i,
          created_at: now,
          updated_at: now,
        });
      }

      rows.push({
        id: crypto.randomUUID(),
        home_id: homeId,
        type: "video",
        url: VIDEO_URLS[homeIndex % VIDEO_URLS.length],
        position: PHOTOS_PER_HOME,
        created_at: now,
        updated_at: now,
      });
    });

    await queryInterface.bulkInsert("home_media", rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("home_media", { home_id: HOME_IDS });
  },
};