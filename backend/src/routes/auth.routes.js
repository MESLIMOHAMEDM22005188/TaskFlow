const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = require("../middleware/auth");
const router = express.Router();

function isValidEmail(email) {
    return typeof email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

        if (!username?.trim() || !isValidEmail(email) || !isStrongPassword(password)) {
            return res.status(400).json({
                message: "Username, valid email, and a strong password are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

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
            [normalizedEmail, hashed, username.trim()]
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
                    (?, 'Family', '👨‍👩‍👧', '#14b8a6')
            `,
            [
                userId,
                userId,
                userId,
                userId,
                userId,
                userId,
                userId,
                userId,
            ]
        );

        res.json({ message: "Account created successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Unable to create account",
        });
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
        return res.status(404).json({
            message: "User not found",
        });
    }

    const match = await bcrypt.compare(currentPassword, rows[0].password);

    if (!match) {
        return res.status(401).json({
            message: "Incorrect current password",
        });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.execute(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashed, req.userId]
    );

    res.json({
        message: "Password updated successfully",
    });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email) || typeof password !== "string" || password.length === 0) {
        return res.status(400).json({
            message: "Email and password are required",
        });
    }

    const [rows] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ token });
});

module.exports = router;