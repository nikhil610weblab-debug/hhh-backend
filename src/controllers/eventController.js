const { Event } = require("../models");

// Keep in sync with frontend/lib/eventThemes.ts THEME_OPTIONS.
const THEMES = ["christmas", "halloween", "thanksgiving", "easter", "generic"];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validateColors({ primaryColor, secondaryColor, accentColor }) {
  for (const [label, value] of [
    ["primaryColor", primaryColor],
    ["secondaryColor", secondaryColor],
    ["accentColor", accentColor],
  ]) {
    if (value !== undefined && value !== null && value !== "" && !HEX_COLOR.test(value)) {
      return `${label} must be a hex color like #dc2626`;
    }
  }
  return null;
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
    const {
      name,
      icon,
      startDate,
      endDate,
      status,
      coverUrl,
      theme,
      primaryColor,
      secondaryColor,
      accentColor,
    } = req.body || {};

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "name, startDate and endDate are required" });
    }

    const colorError = validateColors({ primaryColor, secondaryColor, accentColor });
    if (colorError) return res.status(400).json({ success: false, error: colorError });

    const event = await Event.create({
      name,
      slug: `${makeSlug(name)}-${Date.now().toString(36)}`,
      icon: icon || "tree",
      startDate,
      endDate,
      status: status && ["active", "upcoming", "ended"].includes(status) ? status : "upcoming",
      coverUrl: coverUrl || null,
      theme: theme && THEMES.includes(theme) ? theme : "christmas",
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
      accentColor: accentColor || null,
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

    const {
      name,
      icon,
      startDate,
      endDate,
      status,
      coverUrl,
      theme,
      primaryColor,
      secondaryColor,
      accentColor,
    } = req.body || {};

    if (theme !== undefined && !THEMES.includes(theme)) {
      return res.status(400).json({ success: false, error: `theme must be one of: ${THEMES.join(", ")}` });
    }

    const colorError = validateColors({ primaryColor, secondaryColor, accentColor });
    if (colorError) return res.status(400).json({ success: false, error: colorError });

    await event.update({
      ...(name !== undefined ? { name } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(endDate !== undefined ? { endDate } : {}),
      ...(status !== undefined && ["active", "upcoming", "ended"].includes(status) ? { status } : {}),
      ...(coverUrl !== undefined ? { coverUrl } : {}),
      ...(theme !== undefined ? { theme } : {}),
      // Empty string clears back to "use the preset default".
      ...(primaryColor !== undefined ? { primaryColor: primaryColor || null } : {}),
      ...(secondaryColor !== undefined ? { secondaryColor: secondaryColor || null } : {}),
      ...(accentColor !== undefined ? { accentColor: accentColor || null } : {}),
    });

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

// Admin-only: PATCH /api/events/:id/activate
async function activateEvent(req, res, next) {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: "Event not found" });

    await Event.update({ status: "upcoming" }, { where: { status: "active" } });
    await event.update({ status: "active" });

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
}

// Admin-only: POST /api/events/:id/duplicate
// Copies name, icon, theme, custom colors, and cover image from an existing
// event into a new draft — defaults the dates to exactly one year later
// (the common "same holiday, next year" case) and always starts as
// "upcoming" so it never silently replaces the currently active event.
// Note: sponsors in this app aren't scoped per-event (Sponsor has no
// eventId), so there's nothing to copy there yet — only what's actually
// event-scoped gets duplicated.
async function duplicateEvent(req, res, next) {
  try {
    const source = await Event.findByPk(req.params.id);
    if (!source) return res.status(404).json({ success: false, error: "Event not found" });

    const oneYearLater = (date) => {
      const d = new Date(date);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    };

    const name = `${source.name} (Copy)`;
    const duplicate = await Event.create({
      name,
      slug: `${makeSlug(name)}-${Date.now().toString(36)}`,
      icon: source.icon,
      startDate: oneYearLater(source.startDate),
      endDate: oneYearLater(source.endDate),
      status: "upcoming",
      coverUrl: source.coverUrl,
      theme: source.theme,
      primaryColor: source.primaryColor,
      secondaryColor: source.secondaryColor,
      accentColor: source.accentColor,
    });

    res.status(201).json({ success: true, event: duplicate });
  } catch (error) {
    next(error);
  }
}

module.exports = { listEvents, getActiveEvent, createEvent, updateEvent, activateEvent, duplicateEvent }; 