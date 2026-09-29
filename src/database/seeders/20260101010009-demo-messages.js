"use strict";
const { randomUUID } = require("crypto");

const MESSAGES = [
  { name: "Sarah", body: "This display is absolutely magical, the kids loved it!", rating: 5 },
  { name: "Mike", body: "Best lights on the street, thank you for doing this every year!", rating: 5 },
  { name: "The Patel Family", body: "We drove 20 minutes just to see this, worth every mile.", rating: 5 },
  { name: "Jordan", body: "So creative! Loved the music synced to the lights.", rating: 4 },
  { name: "Emma", body: "Thank you for spreading so much joy in the neighborhood!", rating: 5 },
  { name: "David & Priya", body: "Found this on the app and it did not disappoint at all.", rating: 5 },
  { name: "The Johnson Family", body: "Our new favorite stop on the tour, see you next year!", rating: 4 },
  { name: "Maria", body: "Such a warm welcome, loved the thank-you note too.", rating: 5 },
];

module.exports = {
  async up(queryInterface) {
    const [homes] = await queryInterface.sequelize.query("SELECT id FROM homes LIMIT 8");
    if (homes.length === 0) return; // demo-homes seeder must run first

    const now = Date.now();
    const rows = homes.map((h, i) => {
      const m = MESSAGES[i % MESSAGES.length];
      return {
        id: randomUUID(),
        home_id: h.id,
        author_name: m.name,
        body: m.body,
        rating: m.rating,
        favorited: 0,
        created_at: new Date(now - Math.floor(Math.random() * 48) * 3600 * 1000),
      };
    });

    await queryInterface.bulkInsert("messages", rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("messages", {
      author_name: MESSAGES.map((m) => m.name),
    });
  },
};