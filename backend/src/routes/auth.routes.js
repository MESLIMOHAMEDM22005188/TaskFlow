const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
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
        [...FORBIDDEN_USERNAME_WORDS].some(word =>
            word.length >= 4 && normalized.startsWith(word)
        )) {
        return "Ce pseudo contient un terme interdit. Choisis un autre pseudo.";
    }
    return null;
}

function isValidEmail(email) {
    if (typeof email !== "string") return false;
    const value = email.trim();
    if (value.length > 254 || value.length === 0 || /[\s<>(),;:\[\]\\"]/.test(value)) return false;
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


const RESET_SUCCESS_MESSAGE = "Si cette adresse est associée à un compte, un lien de réinitialisation a été envoyé.";
const RESET_TOKEN_TTL_MINUTES = 30;

async function ensurePasswordResetTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            token_hash CHAR(64) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_password_reset_user (user_id),
            INDEX idx_password_reset_expiry (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
}

router.post("/forgot-password", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Saisis une adresse e-mail valide." });
    }

    try {
        const [users] = await db.execute("SELECT id, email FROM users WHERE email = ? LIMIT 1", [email]);
        if (!users.length) return res.json({ message: RESET_SUCCESS_MESSAGE });

        const apiKey = process.env.RESEND_API_KEY;
        const from = process.env.RESET_EMAIL_FROM;
        const appUrl = process.env.APP_URL || "https://grindlyy.alwaysdata.net";
        if (!apiKey || !from) {
            console.error("[Grindly:Auth] Missing RESEND_API_KEY or RESET_EMAIL_FROM");
            return res.status(503).json({ message: "Service de récupération temporairement indisponible." });
        }

        await ensurePasswordResetTable();
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const resetUrl = new URL("/reset-password", appUrl);
        resetUrl.searchParams.set("token", token);

        const [insertResult] = await db.execute(
            "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
            [users[0].id, tokenHash]
        );

        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from,
                    to: [users[0].email],
                    subject: "Réinitialisation de ton mot de passe Grindly",
                    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1e293b"><h2>Réinitialiser ton mot de passe</h2><p>Une demande de réinitialisation a été reçue pour ton compte Grindly.</p><p><a href="${resetUrl.toString()}" style="display:inline-block;padding:12px 20px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none">Choisir un nouveau mot de passe</a></p><p>Ce lien expire dans ${RESET_TOKEN_TTL_MINUTES} minutes. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p></div>`,
                }),
                signal: AbortSignal.timeout(10000),
            });
            if (!response.ok) {
                console.error("[Grindly:Auth] Resend error", response.status);
                throw new Error("Email delivery failed");
            }
        } catch (error) {
            await db.execute("DELETE FROM password_reset_tokens WHERE id = ?", [insertResult.insertId]);
            throw error;
        }
        return res.json({ message: RESET_SUCCESS_MESSAGE });
    } catch (error) {
        console.error("[Grindly:Auth] Password reset request failed:", error);
        return res.status(503).json({ message: "Envoi indisponible pour le moment. Réessaie plus tard." });
    }
});

router.post("/reset-password", async (req, res) => {
    const { token, password } = req.body || {};
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        return res.status(400).json({ message: "Lien de réinitialisation invalide." });
    }
    if (!isStrongPassword(password)) {
        return res.status(400).json({ message: "Utilise au moins 8 caractères, une majuscule, une minuscule et un chiffre." });
    }
    let connection;
    try {
        await ensurePasswordResetTable();
        const hash = crypto.createHash("sha256").update(token).digest("hex");
        connection = await db.getConnection();
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() FOR UPDATE",
            [hash]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(400).json({ message: "Ce lien est expiré ou a déjà été utilisé. Demande un nouveau lien." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.execute("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, rows[0].user_id]);
        await connection.execute("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL", [rows[0].user_id]);
        await connection.commit();
        return res.json({ message: "Mot de passe mis à jour. Tu peux te connecter." });
    } catch (error) {
        if (connection) await connection.rollback().catch(() => {});
        console.error("[Grindly:Auth] Password reset failed:", error);
        return res.status(500).json({ message: "Réinitialisation impossible pour le moment." });
    } finally {
        if (connection) connection.release();
    }
});

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
