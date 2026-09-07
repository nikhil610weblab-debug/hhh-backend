const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads", "homes");

const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB per photo
const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150MB per video — shared multer ceiling

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(UPLOAD_ROOT, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (![...PHOTO_MIME_TYPES, ...VIDEO_MIME_TYPES].includes(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
}

// Field name is "files" — matches the frontend's FormData.append("files", ...)
const homeMediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_BYTES, files: 25 }, // 20 photos + 5 videos ceiling
});

function mediaTypeFromMime(mimetype) {
  return VIDEO_MIME_TYPES.includes(mimetype) ? "video" : "photo";
}

module.exports = { homeMediaUpload, mediaTypeFromMime, UPLOAD_ROOT, MAX_PHOTO_BYTES, MAX_VIDEO_BYTES };