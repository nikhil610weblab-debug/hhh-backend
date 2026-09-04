const { Event } = require("../models");

// Keep in sync with frontend/lib/eventThemes.ts THEME_OPTIONS.
const THEMES = ["christmas", "halloween", "thanksgiving", "easter", "generic"];

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function listEvents(req, res, next) {
  try {
    const events = await Event.findAll({ order: [["startDate", "ASC"]] });
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
}

// Public: GET /api/events/active
// Returns the single currently-active event (or null), so the site can pick
// up its theme without having to fetch and filter the entire events list.
async function getActiveEvent(req, res, next) {
  try {
    const event = await Event.findOne({ where: { status: "active" } });
    res.json({ success: true, event: event || null });
  } catch (error) {
    next(error);
  }
}

// Admin-only: POST /api/events
async function createEvent(req, res, next) {
  try {
    const { name, icon, startDate, endDate, status, coverUrl, theme } = req.body || {};

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "name, startDate and endDate are required" });
    }

    const event = await Event.create({
      name,
      slug: `${makeSlug(name)}-${Date.now().toString(36)}`,
      icon: icon || "tree",
      startDate,
      endDate,
      status: status && ["active", "upcoming", "ended"].includes(status) ? status : "upcoming",
      coverUrl: coverUrl || null,
      theme: theme && THEMES.includes(theme) ? theme : "christmas",
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/events/:id
async function updateEvent(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    const { name, icon, startDate, endDate, status, coverUrl, theme } = req.body || {};

    if (theme !== undefined && !THEMES.includes(theme)) {
      return res.status(400).json({ success: false, error: `theme must be one of: ${THEMES.join(", ")}` });
    }

    await event.update({
      ...(name !== undefined ? { name } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(endDate !== undefined ? { endDate } : {}),
      ...(status !== undefined && ["active", "upcoming", "ended"].includes(status) ? { status } : {}),
      ...(coverUrl !== undefined ? { coverUrl } : {}),
      ...(theme !== undefined ? { theme } : {}),
    });

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/events/:id/activate
// Makes this event THE single active event visitors see by default, and
// demotes any other currently-active event back to "upcoming" so there's
// never more than one active event at a time.
async function activateEvent(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    await Event.update(
      { status: "upcoming" },
      { where: { status: "active" } }
    );
    await event.update({ status: "active" });

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

module.exports = { listEvents, getActiveEvent, createEvent, updateEvent, activateEvent };