const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const scanRoutes = require("./routes/scanRoutes");
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const nominationRoutes = require("./routes/nominationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const publicRoutes = require("./routes/publicRoutes");
const userRoutes = require("./routes/userRoutes");
const sponsorRoutes = require("./routes/sponsorRoutes");
const yardSignRoutes = require("./routes/yardSignRoutes");
const fulfillmentRoutes = require("./routes/fulfillmentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { notFound, errorHandler } = require("./middleware/error");
const nearbyAlertRoutes = require("./routes/nearbyAlertRoutes");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "HomeHolidayHunt backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/homes", homeRoutes);
app.use("/api/nominations", nominationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api/yard-signs", yardSignRoutes);
app.use("/api/fulfillments", fulfillmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api", publicRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/alert-subscriptions", nearbyAlertRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;