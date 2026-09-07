const fs = require("fs");
const path = require("path");
const { Home, HomeMedia } = require("../models");
const { mediaTypeFromMime, MAX_PHOTO_BYTES } = require("../utils/upload");

const MAX_PHOTOS = 20;
const MAX_VIDEOS = 5;

function toPublicUrl(homeId, filename) {
  return `/uploads/homes/${homeId}/${filename}`;
}

function canEdit(home, user) {
  const isOwner = home.ownerId && home.ownerId === user.id;
  return isOwner || user.role === "admin";
}

async function cleanupFiles(files) {
  await Promise.all((files || []).map((f) => fs.promises.unlink(f.path).catch(() => {})));
}

async function listHomeMedia(req, res, next) {
  try {
    const media = await HomeMedia.findAll({
      where: { homeId: req.params.id },
      order: [["position", "ASC"], ["createdAt", "ASC"]],
    });
    res.json({ success: true, media });
  } catch (error) {
    next(error);
  }
}

async function uploadHomeMedia(req, res, next) {
  const files = req.files || [];
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) {
      await cleanupFiles(files);
      return res.status(404).json({ success: false, error: "Home not found" });
    }

    if (!canEdit(home, req.user)) {
      await cleanupFiles(files);
      return res.status(403).json({ success: false, error: "You do not have permission to edit this listing" });
    }

    if (!files.length) {
      return res.status(400).json({ success: false, error: "No files were uploaded" });
    }

    // Oversized photos slip past the shared multer ceiling (sized for the
    // largest allowed video) — catch those here before touching the DB.
    for (const file of files) {
      if (mediaTypeFromMime(file.mimetype) === "photo" && file.size > MAX_PHOTO_BYTES) {
        await cleanupFiles(files);
        return res.status(400).json({
          success: false,
          error: `${file.originalname} is too large — photos must be under ${Math.round(MAX_PHOTO_BYTES / (1024 * 1024))}MB`,
        });
      }
    }

    const existing = await HomeMedia.findAll({ where: { homeId: home.id } });
    const existingPhotoCount = existing.filter((m) => m.type === "photo").length;
    const existingVideoCount = existing.filter((m) => m.type === "video").length;
    const incomingPhotoCount = files.filter((f) => mediaTypeFromMime(f.mimetype) === "photo").length;
    const incomingVideoCount = files.filter((f) => mediaTypeFromMime(f.mimetype) === "video").length;

    if (existingPhotoCount + incomingPhotoCount > MAX_PHOTOS) {
      await cleanupFiles(files);
      return res.status(400).json({
        success: false,
        error: `This home already has ${existingPhotoCount} photo(s) — only ${Math.max(MAX_PHOTOS - existingPhotoCount, 0)} more allowed (max ${MAX_PHOTOS}).`,
      });
    }
    if (existingVideoCount + incomingVideoCount > MAX_VIDEOS) {
      await cleanupFiles(files);
      return res.status(400).json({
        success: false,
        error: `This home already has ${existingVideoCount} video(s) — only ${Math.max(MAX_VIDEOS - existingVideoCount, 0)} more allowed (max ${MAX_VIDEOS}).`,
      });
    }

    const nextPosition = existing.length ? Math.max(...existing.map((m) => m.position)) + 1 : 0;

    const created = await Promise.all(
      files.map((file, i) =>
        HomeMedia.create({
          homeId: home.id,
          type: mediaTypeFromMime(file.mimetype),
          url: toPublicUrl(home.id, path.basename(file.path)),
          position: nextPosition + i,
        })
      )
    );

    res.status(201).json({ success: true, media: created });
  } catch (error) {
    await cleanupFiles(files);
    next(error);
  }
}

async function deleteHomeMedia(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });
    if (!canEdit(home, req.user)) {
      return res.status(403).json({ success: false, error: "You do not have permission to edit this listing" });
    }

    const media = await HomeMedia.findOne({ where: { id: req.params.mediaId, homeId: home.id } });
    if (!media) return res.status(404).json({ success: false, error: "Media not found" });

    const filePath = path.join(__dirname, "..", "..", media.url.replace(/^\//, ""));
    await media.destroy();
    fs.promises.unlink(filePath).catch(() => {});

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function reorderHomeMedia(req, res, next) {
  try {
    const home = await Home.findByPk(req.params.id);
    if (!home) return res.status(404).json({ success: false, error: "Home not found" });
    if (!canEdit(home, req.user)) {
      return res.status(403).json({ success: false, error: "You do not have permission to edit this listing" });
    }

    const { order } = req.body || {};
    if (!Array.isArray(order) || !order.length) {
      return res.status(400).json({ success: false, error: "order must be a non-empty array of media ids" });
    }

    await Promise.all(
      order.map((mediaId, index) =>
        HomeMedia.update({ position: index }, { where: { id: mediaId, homeId: home.id } })
      )
    );

    const media = await HomeMedia.findAll({ where: { homeId: home.id }, order: [["position", "ASC"]] });
    res.json({ success: true, media });
  } catch (error) {
    next(error);
  }
}

module.exports = { listHomeMedia, uploadHomeMedia, deleteHomeMedia, reorderHomeMedia };