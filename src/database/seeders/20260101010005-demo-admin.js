"use strict";
const bcrypt = require("bcryptjs");

const ADMIN_ID = "a1e1c1a1-0000-4000-8000-000000000001";

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash("Admin123!", 12);
    const now = new Date();

    await queryInterface.bulkInsert("users", [
      {
        id: ADMIN_ID,
        name: "HHH Admin",
        email: "admin@homeholidayhunt.demo",
        password_hash: passwordHash,
        phone: null,
        address: null,
        oauth_provider: null,
        oauth_id: null,
        role: "admin",
        xp: 0,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", { id: ADMIN_ID });
  },
};