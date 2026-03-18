const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
        "INSERT INTO users (email, password, username) VALUES (?, ?, ?)",
        [email, hashed, username || null],
    );

    res.json({ message: "User created" });
});

const authMiddleware = require("../middleware/auth")

router.put("/change-password", authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body

    const [rows] = await db.execute(
        "SELECT * FROM users WHERE id = ?",
        [req.userId]
    )

    if (rows.length === 0) return res.status(404).json({ message: "User not found" })

    const match = await bcrypt.compare(currentPassword, rows[0].password)
    if (!match) return res.status(401).json({ message: "Wrong current password" })

    const hashed = await bcrypt.hash(newPassword, 10)
    await db.execute(
        "UPDATE users SET password = ? WHERE id = ?",
        [hashed, req.userId]
    )

    res.json({ message: "Password updated" })
})
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await db.execute(
        "SELECT * FROM users WHERE email = ?",
        [email]
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