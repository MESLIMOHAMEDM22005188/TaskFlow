const express = require("express")
const db = require("../config/db")
const { updateAchievements } = require("../services/achievement.service")

const router = express.Router()

// GET tasks
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
            [req.userId]
        )
        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error" })
    }
})

// CREATE task
router.post("/", async (req, res) => {
    try {
        const { title, priority, theme_id, frequency, deadline, note } = req.body

        const [result] = await db.execute(
            `INSERT INTO tasks 
            (user_id, theme_id, title, priority, frequency, deadline, note) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId,
                theme_id || null,
                title,
                priority || "Medium",
                frequency || "daily",
                deadline || null,
                note || null
            ]
        )

        const [rows] = await db.execute(
            "SELECT * FROM tasks WHERE id = ?",
            [result.insertId]
        )

        res.json(rows[0])

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error" })
    }
})

// DELETE task
router.delete("/:id", async (req, res) => {
    try {
        await db.execute(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        res.json({ message: "Task deleted" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error" })
    }
})

// GET today completions
router.get("/completions/today", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT task_id 
             FROM task_completions 
             WHERE user_id = ? 
             AND DATE(completed_at) = CURRENT_DATE`,
            [req.userId]
        )

        res.json(rows.map(r => r.task_id))

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error" })
    }
})

// COMPLETE task
router.post("/:id/complete", async (req, res) => {
    try {
        const [tasks] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" })
        }

        const task = tasks[0]

        const xpMap = { Low: 10, Medium: 25, High: 50 }
        const xpGained = xpMap[task.priority] ?? 10

        await db.execute(
            "INSERT INTO task_completions (task_id, user_id) VALUES (?, ?)",
            [req.params.id, req.userId]
        )

        await db.execute(
            "UPDATE users SET xp = xp + ? WHERE id = ?",
            [xpGained, req.userId]
        )

        // 🔥 MAJ achievements
        await updateAchievements(req.userId)

        res.json({ message: "Task completed", xpGained })

    } catch (err) {
        console.error(err)
        res.status(400).json({ message: "Already completed today" })
    }
})

// UNDO task
router.delete("/:id/complete", async (req, res) => {
    try {
        const [tasks] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" })
        }

        const task = tasks[0]

        const xpMap = { Low: 10, Medium: 25, High: 50 }
        const xpLost = xpMap[task.priority] ?? 10

        await db.execute(
            `DELETE FROM task_completions 
             WHERE task_id = ? 
             AND user_id = ? 
             AND DATE(completed_at) = CURRENT_DATE`,
            [req.params.id, req.userId]
        )

        await db.execute(
            "UPDATE users SET xp = GREATEST(0, xp - ?) WHERE id = ?",
            [xpLost, req.userId]
        )

        // 🔥 MAJ achievements
        await updateAchievements(req.userId)

        res.json({ message: "Task undone", xpLost })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error" })
    }
})

module.exports = router