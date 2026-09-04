const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");
const { signToken } = require("../utils/jwt");
const { sendEmail } = require("../utils/notify");
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isProd = process.env.NODE_ENV === "production";
// Keep this in sync with JWT_EXPIRES_IN in .env (default "7d" in jwt.js).
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    xp: user.xp,
    authProvider: user.oauthProvider || "local",
  };
}

// Signs the JWT, sets it as an httpOnly cookie (never readable by JS —
// closes the XSS-token-theft gap localStorage had), and sets a separate
// non-httpOnly CSRF cookie the frontend echoes back as a header on every
// mutating request. Returns the CSRF token so the caller can also hand it
// back in the JSON body for immediate use.
function setAuthCookies(res, user) {
  const token = signToken(user);
  const csrfToken = crypto.randomBytes(24).toString("hex");

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });

  res.cookie("csrf_token", csrfToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
    path: "/",
  });

  return csrfToken;
}

function clearAuthCookies(res) {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("csrf_token", { path: "/" });
}

async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      address,
      role = "viewer",
    } = req.body || {};

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "name, email, password and confirmPassword are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, error: "Password must be at least 8 characters long" });
    }

    if (!Object.prototype.hasOwnProperty.call({ viewer: true, homeowner: true, admin: true }, role)) {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone ? String(phone).trim() : null,
      address: address ? String(address).trim() : null,
      role,
    });

    const csrfToken = setAuthCookies(res, user);

    sendEmail({
      to: user.email,
      subject: "Welcome to Home Holiday Hunt!",
      text: `Hi ${user.name}, thanks for signing up for Home Holiday Hunt. Start exploring homes near you or nominate one you love!`,
    }).catch(() => { });

    res.status(201).json({ success: true, csrfToken, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "email and password are required" });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const csrfToken = setAuthCookies(res, user);
    res.json({ success: true, csrfToken, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function googleAuth(req, res, next) {
  try {
    const { credential, role = "viewer" } = req.body || {};
    if (!credential) {
      return res.status(400).json({ success: false, error: "Missing Google credential" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(501).json({
        success: false,
        error: "Google sign-in is not configured on the server yet",
      });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ success: false, error: "Invalid Google credential" });
    }

    if (!payload || !payload.email) {
      return res.status(401).json({ success: false, error: "Invalid Google credential" });
    }

    const normalizedEmail = payload.email.trim().toLowerCase();

    let user = await User.findOne({
      where: { oauthProvider: "google", oauthId: payload.sub },
    });

    if (!user) {
      user = await User.findOne({ where: { email: normalizedEmail } });

      if (user) {
        user.oauthProvider = user.oauthProvider || "google";
        user.oauthId = user.oauthId || payload.sub;
        await user.save();
      } else {
        user = await User.create({
          name: payload.name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          passwordHash: null,
          oauthProvider: "google",
          oauthId: payload.sub,
          role: role === "homeowner" ? "homeowner" : "viewer",
        });
      }
    }

    const csrfToken = setAuthCookies(res, user);
    res.json({ success: true, csrfToken, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ success: true, user: publicUser(req.user), csrfToken: req.cookies?.csrf_token || null });
}

async function logout(req, res) {
  clearAuthCookies(res);
  res.json({ success: true });
}

// POST /api/auth/request-password-reset  { email }
// Always responds success regardless of whether the email exists — this
// prevents attackers from using this endpoint to discover which emails are
// registered (user enumeration).
async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: "email is required" });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = hashResetToken(rawToken);
      user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;
      console.log(`[DEV ONLY] Password reset link: ${resetUrl}`);

      sendEmail({
        to: user.email,
        subject: "Reset your Home Holiday Hunt password",
        text: `Hi ${user.name}, click the link below to reset your password. This link expires in 1 hour and can only be used once.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `<p>Hi ${user.name},</p><p>Click the link below to reset your password. This link expires in 1 hour and can only be used once.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      }).catch(() => { });
    }

    res.json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/reset-password  { token, password, confirmPassword }
async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body || {};

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "token, password and confirmPassword are required",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: false, error: "Password must be at least 8 characters long" });
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({ where: { resetTokenHash: tokenHash } });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "This reset link is invalid or has expired" });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.resetTokenHash = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    // Log them straight in — same pattern as register/login.
    const csrfToken = setAuthCookies(res, user);
    res.json({ success: true, csrfToken, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, googleAuth, me, logout, requestPasswordReset, resetPassword };