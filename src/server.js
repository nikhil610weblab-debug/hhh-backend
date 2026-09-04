require("dotenv").config();

const app = require("./app");
const { sequelize } = require("./models");

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection established.");
    console.log(
      "Schema is managed by Sequelize CLI migrations — run `npm run db:migrate` " +
        "(and `npm run db:seed` for demo data) if you haven't yet."
    );

    app.listen(PORT, () => {
      console.log(`HomeHolidayHunt API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
