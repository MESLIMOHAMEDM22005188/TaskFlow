const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Username policy: 3–20 ASCII letters, digits, underscores or hyphens.
const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,20}$/;
const RESERVED_USERNAME_PREFIXES = [
    "admin", "administrator", "moderator", "mod", "support", "helpdesk",
    "staff", "owner", "root", "system", "security", "official", "grindly",
    "webmaster", "api", "null", "undefined"
];

// LDNOOBW French and English wordlists. Attribution is in THIRD_PARTY_NOTICES.md.
const RAW_FORBIDDEN_USERNAME_WORDS = require("../data/forbidden-username-words.json");

function normalizeBlacklistWord(value) {
    return String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

const FORBIDDEN_USERNAME_WORDS = new Set(
    RAW_FORBIDDEN_USERNAME_WORDS.map(normalizeBlacklistWord).filter(Boolean)
);

// Normalize accents, common leetspeak and separators before checking the blacklist.
function normalizeUsername(value) {
    return String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/[1!|]/g, "i")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t")
        .replace(/[^a-z0-9]/g, "");
}

function getUsernameError(username) {
    if (typeof username !== "string") return "Le pseudo est obligatoire.";
    const value = username.trim();
    if (value.length < 3) return "Le pseudo doit contenir au moins 3 caractères.";
    if (value.length > 20) return "Le pseudo ne peut pas dépasser 20 caractères.";
    if (!USERNAME_REGEX.test(value)) {
        return "Le pseudo doit utiliser uniquement des lettres sans accent, des chiffres, _ ou -, sans espace.";
    }

    const normalized = normalizeUsername(value);
    const words = value.toLowerCase().split(/[_-]+/).filter(Boolean).map(normalizeUsername);
    if (RESERVED_USERNAME_PREFIXES.some(prefix => normalized.startsWith(normalizeUsername(prefix)))) {
        return "Ce pseudo est réservé et ne peut pas être utilisé.";
    }

    // Exact matches catch short profanities; token and substring checks catch variants.
    if (FORBIDDEN_USERNAME_WORDS.has(normalized) ||
        words.some(word => FORBIDDEN_USERNAME_WORDS.has(word)) ||
        [...FORBIDDEN_USERNAME_WORDS].some(word => word.length >= 4 && normalized.includes(word))) {
        return "Ce pseudo contient un terme interdit. Choisis un autre pseudo.";
    }
    return null;
}

function isValidEmail(email) {
    if (typeof email !== "string") return false;
    const value = email.trim();
    if (value.length > 254 || value.length === 0 || /[\s<>(),;:\[\]\\"]/ .test(value)) return false;
    const parts = value.split("@");
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
    if (!/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+$/.test(local)) return false;
    if (!domain || domain.length > 253 || !domain.includes(".")) return false;
    const labels = domain.split(".");
    if (labels.some(label => !label || label.length > 63 || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label))) return false;
    const tld = labels[labels.length - 1];
    return /^[A-Za-z]{2,63}$/.test(tld);
}

function isStrongPassword(password) {
    return typeof password === "string" &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password);
}

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const usernameError = getUsernameError(username);
        if (usernameError) {
            return res.status(400).json({ message: usernameError });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({
                message: "Adresse e-mail invalide. Vérifie le format et réessaie.",
            });
        }
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.",
            });
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        const [existingNames] = await db.execute(
            "SELECT id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1",
            [normalizedUsername]
        );
        if (existingNames.length > 0) {
            return res.status(409).json({ message: "Ce pseudo est déjà utilisé." });
        }

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email already in use",
            });
        }

        const hashed = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
            [normalizedEmail, hashed, normalizedUsername]
        );

        const userId = result.insertId;

        // Create default themes for every new user
        await db.execute(
            `
                INSERT INTO themes (user_id, name, emoji, color)
                VALUES
                    (?, 'Work', '💼', '#3b82f6'),
                    (?, 'Studies', '📚', '#8b5cf6'),
                    (?, 'Sport', '💪', '#22c55e'),
                    (?, 'Health', '❤️', '#ef4444'),
                    (?, 'Finance', '💰', '#f59e0b'),
                    (?, 'Personal Development', '🧠', '#06b6d4'),
                    (?, 'Leisure', '🎮', '#ec4899'),
                    (?, 'Family', '👨‍👩‍👧', '#14b8a6'),
                    (?, 'Faith', '🕌', '#0f766e')
            `,
            [
                userId, userId, userId, userId, userId,
                userId, userId, userId, userId,
            ]
        );

        res.json({ message: "Account created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to create account" });
    }
});

router.put("/change-password", authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !isStrongPassword(newPassword)) {
        return res.status(400).json({
            message: "Current password and a strong new password are required",
        });
    }

    const [rows] = await db.execute(
        "SELECT * FROM users WHERE id = ?",
        [req.userId]
    );

    if (rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password);
    if (!match) {
        return res.status(401).json({ message: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashed, req.userId]
    );

    res.json({ message: "Password updated successfully" });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email) || typeof password !== "string" || password.length === 0) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ token });
});

module.exports = router;
