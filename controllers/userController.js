import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";



function signToken(user, rememberMe) {
  return jwt.sign(
    {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      role: user.role,
      image: user.image,
    },
    process.env.JWT_SECRET,
    { expiresIn: rememberMe ? "30d" : "48h" }
  );
}

function buildAvatarDataUri(name) {
  const initials = String(name || "Player")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "P";

  const palette = ["#6D28D9", "#0F766E", "#1D4ED8", "#BE123C", "#B45309", "#166534"];
  const index = initials.charCodeAt(0) % palette.length;
  const bg = palette[index];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="32" fill="${bg}"/>
      <circle cx="80" cy="58" r="28" fill="rgba(255,255,255,0.18)"/>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="52" fill="#fff">${initials}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function slugifyUsername(value) {
  return String(value || "player")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18) || "player";
}

async function makeUniqueUsername(base) {
  const seed = slugifyUsername(base);
  let candidate = seed;
  let counter = 1;
  while (await User.exists({ username: candidate })) {
    candidate = `${seed}${counter}`.slice(0, 24);
    counter += 1;
  }
  return candidate;
}

export async function createUser(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    const username = await makeUniqueUsername(`${firstName}${lastName}` || email.split("@")[0]);
    const image = buildAvatarDataUri(`${firstName} ${lastName}`.trim());

    const user = new User({ firstName, lastName, email, username, image, password: hashPassword });
    await user.save();

    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "User creation failed" });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with given email not found" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = signToken(user, rememberMe);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        image: user.image,
        highScore: user.highScore,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
}

export function logoutUser(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.json({ message: "Logged out" });
}

export async function getMe(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });
    const user = await User.findById(req.user.id).select("firstName lastName username email image highScore lastScore totalRuns coins reviveCredits checkpointScore checkpointMode createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch {
    res.status(500).json({ message: "Failed to load profile" });
  }
}

export async function updateMe(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Not logged in" });

    const { username, firstName, lastName } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const normalized = slugifyUsername(username);
      const taken = await User.findOne({ username: normalized, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ message: "Username already taken" });
      user.username = normalized;
    }

    if (firstName) user.firstName = String(firstName).trim();
    if (lastName) user.lastName = String(lastName).trim();
    user.image = buildAvatarDataUri(`${user.firstName} ${user.lastName}`.trim() || user.username);

    await user.save();

    const token = signToken(user, true);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Profile updated",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        image: user.image,
        highScore: user.highScore,
        lastScore: user.lastScore,
        totalRuns: user.totalRuns,
        coins: user.coins,
        reviveCredits: user.reviveCredits,
        checkpointScore: user.checkpointScore,
        checkpointMode: user.checkpointMode,
        createdAt: user.createdAt,
      },
    });
  } catch {
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export function isAdmin(req) {
  return req.user?.role === "admin";
}
