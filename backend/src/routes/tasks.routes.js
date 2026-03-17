const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
        [req.userId]
    )
    res.json(rows)
})

router.post("/", async (req, res) => {
    const { title, priority, theme_id, frequency, deadline, note } = req.body
    const [result] = await db.execute(
        "INSERT INTO tasks (user_id, theme_id, title, priority, frequency, deadline, note) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [req.userId, theme_id || null, title, priority || "Medium", frequency || "daily", deadline || null, note || null]
    )
    const [rows] = await db.execute("SELECT * FROM tasks WHERE id = ?", [result.insertId])
    res.json(rows[0])
})

router.delete("/:id", async (req, res) => {
    await db.execute(
        "DELETE FROM tasks WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )
    res.json({ message: "Task deleted" })
})

router.post("/:id/complete", async (req, res) => {
    try {
        await db.execute(
            "INSERT INTO task_completions (task_id, user_id) VALUES (?, ?)",
            [req.params.id, req.userId]
        )
        res.json({ message: "Task completed" })
    } catch {
        res.status(400).json({ message: "Already completed today" })
    }
})

router.delete("/:id/complete", async (req, res) => {
    await db.execute(
        "DELETE FROM task_completions WHERE task_id = ? AND user_id = ? AND completed_at = CURRENT_DATE",
        [req.params.id, req.userId]
    )
    res.json({ message: "Task undone" })
})

module.exports = router