const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { email, password } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashed]
    );

    res.json({ message: "User created" });
});

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