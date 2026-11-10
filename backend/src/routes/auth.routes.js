const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = require("../middleware/auth");

const crypto = require("crypto");

// Recovery state is short-lived and kept server-side. Only hashes of arithmetic
// answers are stored; email addresses and MySQL user IDs never reach the browser.
const recoveryChallenges = new Map();
const recoveryFlows = new Map();
const RECOVERY_TTL_MS = 10 * 60 * 1000;
const MAX_RECOVERY_ATTEMPTS = 5;

function pruneRecoveryState() {
    const now = Date.now();
    for (const [key, value] of recoveryChallenges) {
        if (value.expiresAt <= now) recoveryChallenges.delete(key);
    }
    for (const [key, value] of recoveryFlows) {
        if (value.expiresAt <= now) recoveryFlows.delete(key);
    }
    while (recoveryChallenges.size > 5000) recoveryChallenges.delete(recoveryChallenges.keys().next().value);
    while (recoveryFlows.size > 5000) recoveryFlows.delete(recoveryFlows.keys().next().value);
}

function makeRecoveryChallenge(user) {
    pruneRecoveryState();
    const left = crypto.randomInt(2, 13);
    const right = crypto.randomInt(2, 13);
    const id = crypto.randomBytes(32).toString("hex");
    recoveryChallenges.set(id, {
        answerHash: crypto.createHash("sha256").update(String(left * right)).digest("hex"),
        userId: user?.id ?? null,
        email: user?.email ?? null,
        expiresAt: Date.now() + RECOVERY_TTL_MS,
        attempts: 0,
    });
    return { challengeId: id, question: String(left) + " × " + String(right) };
}

function validRecoveryEmail(email) {
    return typeof email === "string" && email.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getSupabaseConfig() {
    const url = process.env.SUPABASE_URL || "https://ffykzjxnsgdkzxcppvoo.supabase.co";
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!secret) throw new Error("SUPABASE_SECRET_KEY is missing from the backend environment.");
    return { url: url.replace(/\/+$/, ""), secret };
}

async function supabaseAuthRequest(path, body) {
    const config = getSupabaseConfig();
    const response = await fetch(config.url + "/auth/v1/" + path, {
        method: "POST",
        headers: {
            apikey: config.secret,
            Authorization: "Bearer " + config.secret,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    let payload = {};
    try { payload = await response.json(); } catch { /* Empty or non-JSON response. */ }
    return { response, payload };
}

// Provision a confirmed Supabase identity lazily for each existing MySQL user.
// Its random password is never exposed or used by TaskFlow.
async function ensureSupabaseIdentity(email) {
    const randomPassword = crypto.randomBytes(48).toString("base64url");
    const result = await supabaseAuthRequest("admin/users", {
        email,
        password: randomPassword,
        email_confirm: true,
    });
    if (result.response.ok) return;

    const details = JSON.stringify(result.payload).toLowerCase();
    const alreadyExists = result.response.status === 422 &&
        (details.includes("already registered") ||
         details.includes("already exists") ||
         details.includes("user_already_exists"));
    if (!alreadyExists) {
        throw new Error("Supabase could not provision the recovery identity (HTTP " + result.response.status + ").");
    }
}

async function sendSupabaseRecoveryCode(email) {
    const result = await supabaseAuthRequest("recover", { email });
    if (!result.response.ok) {
        throw new Error("Supabase could not send the recovery email (HTTP " + result.response.status + ").");
    }
}

async function verifySupabaseRecoveryCode(email, token) {
    const result = await supabaseAuthRequest("verify", { email, token, type: "recovery" });
    return Boolean(result.response.ok && result.payload.user?.email &&
        result.payload.user.email.toLowerCase() === email.toLowerCase());
}


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


/**
 * Step 1: find the MySQL account by username and issue a generic challenge.
 * The response is identical whether the account exists or not.
 */
router.post("/forgot-password/challenge", async (req, res) => {
    try {
        const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
        if (!username || username.length > 20 || !/^[A-Za-z0-9_-]{3,20}$/.test(username)) {
            return res.status(400).json({ message: "Saisis un pseudo TaskFlow valide." });
        }
        const [rows] = await db.execute(
            "SELECT id, email FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1",
            [username]
        );
        const user = rows.length === 1 && validRecoveryEmail(rows[0].email)
            ? { id: rows[0].id, email: rows[0].email.trim().toLowerCase() }
            : null;
        const challenge = makeRecoveryChallenge(user);
        return res.json({
            message: "Si ce pseudo correspond à un compte, tu pourras recevoir un code sur son adresse e-mail enregistrée.",
            challenge: challenge.question,
            challengeId: challenge.challengeId,
        });
    } catch (error) {
        console.error("[Grindly:PasswordRecovery] Challenge error:", error.message);
        return res.status(500).json({ message: "Impossible de préparer la récupération pour le moment." });
    }
});

/**
 * Step 2: validate the arithmetic challenge, provision the Supabase Auth
 * identity if needed, and ask Supabase to send its recovery OTP.
 */
router.post("/forgot-password/send-code", async (req, res) => {
    const challengeId = typeof req.body?.challengeId === "string" ? req.body.challengeId : "";
    const answer = String(req.body?.answer ?? "");
    const challenge = recoveryChallenges.get(challengeId);
    if (!challenge || challenge.expiresAt <= Date.now() ||
        challenge.attempts >= 3 || !/^\d{1,4}$/.test(answer)) {
        recoveryChallenges.delete(challengeId);
        return res.status(400).json({ message: "Le calcul a expiré ou est invalide. Recommence." });
    }

    const answerHash = crypto.createHash("sha256").update(answer).digest("hex");
    const expected = Buffer.from(challenge.answerHash, "hex");
    const received = Buffer.from(answerHash, "hex");
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        challenge.attempts += 1;
        if (challenge.attempts >= 3) recoveryChallenges.delete(challengeId);
        return res.status(400).json({ message: "Résultat incorrect. Vérifie le calcul." });
    }

    recoveryChallenges.delete(challengeId);
    const flowId = crypto.randomBytes(32).toString("hex");
    const flow = {
        userId: challenge.userId,
        email: challenge.email,
        expiresAt: Date.now() + RECOVERY_TTL_MS,
        attempts: 0,
    };
    recoveryFlows.set(flowId, flow);
    pruneRecoveryState();

    if (flow.userId && flow.email) {
        try {
            await ensureSupabaseIdentity(flow.email);
            await sendSupabaseRecoveryCode(flow.email);
        } catch (error) {
            // Keep the public response identical for existing and unknown usernames.
            // The server log records the provider failure without exposing account existence.
            console.error("[Grindly:PasswordRecovery] Email dispatch failed:", error.message);
        }
    }

    return res.json({
        flowId,
        message: "Si le compte existe, un code de vérification a été envoyé à son adresse e-mail enregistrée.",
    });
});

/**
 * Step 3: verify the Supabase recovery OTP server-side, then update only the
 * corresponding MySQL bcrypt password. Supabase sessions never reach the client.
 */
router.post("/forgot-password/reset", async (req, res) => {
    const flowId = typeof req.body?.flowId === "string" ? req.body.flowId : "";
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const newPassword = req.body?.newPassword;
    const flow = recoveryFlows.get(flowId);

    if (!flow || flow.expiresAt <= Date.now() ||
        flow.attempts >= MAX_RECOVERY_ATTEMPTS ||
        !/^\d{6}$/.test(token) || !isStrongPassword(newPassword)) {
        if (flow && (flow.expiresAt <= Date.now() || flow.attempts >= MAX_RECOVERY_ATTEMPTS)) {
            recoveryFlows.delete(flowId);
        }
        return res.status(400).json({
            message: "Code invalide ou expiré. Vérifie le code et les critères du nouveau mot de passe.",
        });
    }
    if (!flow.userId || !flow.email) {
        recoveryFlows.delete(flowId);
        return res.status(400).json({ message: "Code invalide ou expiré. Recommence la récupération." });
    }

    try {
        const verified = await verifySupabaseRecoveryCode(flow.email, token);
        if (!verified) {
            flow.attempts += 1;
            if (flow.attempts >= MAX_RECOVERY_ATTEMPTS) recoveryFlows.delete(flowId);
            return res.status(400).json({ message: "Code incorrect ou expiré." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await db.execute(
            "UPDATE users SET password = ? WHERE id = ? AND LOWER(email) = ?",
            [hashedPassword, flow.userId, flow.email]
        );
        if (!result.affectedRows) {
            recoveryFlows.delete(flowId);
            return res.status(400).json({ message: "Le compte n'a pas pu être mis à jour. Recommence la récupération." });
        }

        for (const [pendingId, pendingFlow] of recoveryFlows) {
            if (pendingFlow.userId === flow.userId) recoveryFlows.delete(pendingId);
        }
        return res.json({ message: "Mot de passe modifié. Tu peux maintenant te connecter à TaskFlow." });
    } catch (error) {
        console.error("[Grindly:PasswordRecovery] Reset error:", error.message);
        return res.status(503).json({ message: "La vérification est momentanément indisponible. Recommence la procédure." });
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
