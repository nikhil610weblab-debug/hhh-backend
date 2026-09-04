"use strict";

const EVENT_ID = "8dcc89e7-2954-4ac7-bc0e-cfbb95ac78be";

const HOMES = [
  { id: "b60534c9-41f3-45a1-8826-27f6d2586c12", address: "123 Maple Street", city: "Sandy Springs", state: "GA", lat: 33.9243, lng: -84.3781 },
  { id: "b5b62599-d6e0-4262-bfd8-489438663237", address: "456 Oak Avenue", city: "Sandy Springs", state: "GA", lat: 33.9301, lng: -84.3699 },
  { id: "be9b9cc7-d60b-4ca1-b44c-3d99c78222ea", address: "789 Pine Road", city: "Dunwoody", state: "GA", lat: 33.9462, lng: -84.3346 },
  { id: "83871951-be1e-4fa8-b5bd-0333131e53e5", address: "321 Elm Drive", city: "Brookhaven", state: "GA", lat: 33.8654, lng: -84.3382 },
  { id: "9af423f8-9574-4cfe-b0d0-175ca1af2e85", address: "12 Frost Lane", city: "Decatur", state: "GA", lat: 33.7748, lng: -84.2963 },
  { id: "51b14a94-ee34-490e-a785-f9ff02cca991", address: "9 Snowbell Way", city: "Decatur", state: "GA", lat: 33.7701, lng: -84.29 },
  { id: "186f2695-04ea-4f82-8cd5-57edac10ba28", address: "204 Candy Cane Ln", city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388 },
  { id: "6d3bfef1-b2e4-4007-a77c-fd9b47682a4c", address: "77 Tinsel Trail", city: "Atlanta", state: "GA", lat: 33.755, lng: -84.392 },
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
  },
};
