"use strict";

const EVENT_ID = "f3a91c2e-6b4d-4e1a-9c7f-2d8e5a1b6c30";

const HOMES = [
  {
    id: "a1c4e8f2-3b5d-4a9e-8f1c-6d2b7a4e9013",
    address: "13 Raven Court",
    city: "Sandy Springs",
    state: "GA",
    lat: 33.9205,
    lng: -84.3755,
  },
  {
    id: "b2d5f9a3-4c6e-4b8f-9a2d-7e3c8b5f1024",
    address: "666 Pumpkin Patch Rd",
    city: "Dunwoody",
    state: "GA",
    lat: 33.9438,
    lng: -84.3312,
  },
  {
    id: "c3e6a0b4-5d7f-4c9a-8b3e-8f4d9c6a2135",
    address: "31 Spooky Hollow Ln",
    city: "Decatur",
    state: "GA",
    lat: 33.7729,
    lng: -84.2941,
  },
];

function makeSlug(address, city) {
  return `${address}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("events", [
      {
        id: EVENT_ID,
        name: "Halloween 2025",
        slug: "halloween-2025",
        icon: "pumpkin",
        start_date: new Date("2025-10-01"),
        end_date: new Date("2025-10-31"),
        status: "ended",
        cover_url: null,
        theme: "halloween",
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert(
      "homes",
      HOMES.map((h) => ({
        id: h.id,
        address: h.address,
        city: h.city,
        state: h.state,
        lat: h.lat,
        lng: h.lng,
        title: null,
        description: null,
        photo_url: null,
        is_active: true,
        rating_avg: 0,
        rating_count: 0,
        slug: makeSlug(h.address, h.city),
        owner_id: null,
        event_id: EVENT_ID,
        created_at: now,
        updated_at: now,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("homes", { event_id: EVENT_ID });
    await queryInterface.bulkDelete("events", { id: EVENT_ID });
  },
};