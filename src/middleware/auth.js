const jwt = require("jsonwebtoken");
const { User } = require("../models");

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Double-submit CSRF check: the CSRF cookie is NOT httpOnly, so only JS
// running on our own origin can read it and echo it back as a header. An
// attacker's cross-site form/script can make the browser attach the auth
// cookie automatically, but can't read the CSRF cookie to forge the header.
function verifyCsrf(req) {
  if (SAFE_METHODS.includes(req.method)) return true;
  const cookieValue = req.cookies?.csrf_token;
  const headerValue = req.headers["x-csrf-token"];
  return Boolean(cookieValue) && Boolean(headerValue) && cookieValue === headerValue;
}

async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { attributes: { exclude: ["passwordHash"] } });

    if (!user) {
      return res.status(401).json({ success: false, error: "User no longer exists" });
    }

    if (!verifyCsrf(req)) {
      return res.status(403).json({ success: false, error: "Invalid or missing CSRF token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired session" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "You do not have permission for this action" });
    }
    next();
  };
}

// Like `authenticate`, but never rejects the request outright — used on
// routes guests can hit (e.g. guest book messages) that just personalize
// the response when the visitor happens to be logged in. If the CSRF check
// fails on a mutating request here, we fall back to treating the request as
// anonymous rather than blocking it, since the route already allows guests.
async function optionalAuthenticate(req, res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next();

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { attributes: { exclude: ["passwordHash"] } });
    if (!user) return next();

    if (!verifyCsrf(req)) return next();

    req.user = user;
    next();
  } catch {
    next();
  }
}

module.exports = { authenticate, authorize, optionalAuthenticate };