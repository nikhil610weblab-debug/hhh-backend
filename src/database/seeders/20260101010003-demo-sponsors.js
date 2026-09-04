"use strict";

const SPONSOR_IDS = [
  "db70d097-bf1f-48f1-a982-3abea9cc35d3",
  "bc2205f4-53f5-4d10-89ea-a9f10ee58728",
  "87134e47-6362-47ff-9a70-c4dc223b6be1",
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("sponsors", [
      { id: SPONSOR_IDS[0], name: "Peachtree Hardware", logo_url: null, url: null, tier: "gold", created_at: now },
      { id: SPONSOR_IDS[1], name: "North Metro Realty", logo_url: null, url: null, tier: "platinum", created_at: now },
      { id: SPONSOR_IDS[2], name: "Sandy Springs Coffee Co.", logo_url: null, url: null, tier: "local", created_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("sponsors", { id: SPONSOR_IDS });
  },
};
