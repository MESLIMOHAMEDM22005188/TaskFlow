const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM themes WHERE user_id = ? ORDER BY created_at DESC",
        [req.userId]
    )
    res.json(rows)
})

router.post("/", async (req, res) => {
    const { name, emoji, color } = req.body
    const [result] = await db.execute(
        "INSERT INTO themes (user_id, name, emoji, color) VALUES (?, ?, ?, ?)",
        [req.userId, name, emoji || null, color || "#6366f1"]
    )
    const [rows] = await db.execute("SELECT * FROM themes WHERE id = ?", [result.insertId])
    res.json(rows[0])
})

router.delete("/:id", async (req, res) => {
    await db.execute(
        "DELETE FROM themes WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )
    res.json({ message: "Theme deleted" })
})

module.exports = router