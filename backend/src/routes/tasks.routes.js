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

router.get("/completions/today", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT task_id FROM task_completions WHERE user_id = ? AND completed_at = CURRENT_DATE",
        [req.userId]
    )
    res.json(rows.map(r => r.task_id))
})
router.post("/:id/complete", async (req, res) => {
    try {
        // Récupère la tâche pour connaître la priorité
        const [tasks] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        if (tasks.length === 0) return res.status(404).json({ message: "Task not found" })

        const task = tasks[0]

        // XP selon priorité
        const xpMap = { Low: 10, Medium: 25, High: 50 }
        const xpGained = xpMap[task.priority] ?? 10

        // Insère la completion
        await db.execute(
            "INSERT INTO task_completions (task_id, user_id) VALUES (?, ?)",
            [req.params.id, req.userId]
        )

        // Ajoute les XP
        await db.execute(
            "UPDATE users SET xp = xp + ? WHERE id = ?",
            [xpGained, req.userId]
        )

        // Récupère les stats actuelles pour les succès
        const [[{ totalTasks }]] = await db.execute(
            "SELECT COUNT(*) as totalTasks FROM task_completions WHERE user_id = ?",
            [req.userId]
        )

        const [[{ currentXp }]] = await db.execute(
            "SELECT xp as currentXp FROM users WHERE id = ?",
            [req.userId]
        )

        // Met à jour les succès de type 'tasks' et 'xp'
        await db.execute(`
            INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
            SELECT ?, a.id, 
                CASE 
                    WHEN a.type = 'tasks' THEN ?
                    WHEN a.type = 'xp' THEN ?
                END,
                CASE 
                    WHEN a.type = 'tasks' AND ? >= a.goal THEN TRUE
                    WHEN a.type = 'xp' AND ? >= a.goal THEN TRUE
                    ELSE FALSE
                END
            FROM achievements a
            WHERE a.type IN ('tasks', 'xp')
            ON DUPLICATE KEY UPDATE
                progress = CASE 
                    WHEN a.type = 'tasks' THEN ?
                    WHEN a.type = 'xp' THEN ?
                END,
                completed = CASE 
                    WHEN a.type = 'tasks' AND ? >= a.goal THEN TRUE
                    WHEN a.type = 'xp' AND ? >= a.goal THEN TRUE
                    ELSE completed
                END
        `, [
            req.userId,
            totalTasks, currentXp,
            totalTasks, currentXp,
            totalTasks, currentXp,
            totalTasks, currentXp
        ])

        res.json({ message: "Task completed", xpGained })

    } catch (err) {
        console.error(err)
        res.status(400).json({ message: "Already completed today" })
    }
})

router.delete("/:id/complete", async (req, res) => {
    try {
        const [tasks] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        if (tasks.length === 0) return res.status(404).json({ message: "Task not found" })

        const task = tasks[0]

        const xpMap = { Low: 10, Medium: 25, High: 50 }
        const xpLost = xpMap[task.priority] ?? 10

        await db.execute(
            "DELETE FROM task_completions WHERE task_id = ? AND user_id = ? AND completed_at = CURRENT_DATE",
            [req.params.id, req.userId]
        )

        // Retire les XP sans descendre sous 0
        await db.execute(
            "UPDATE users SET xp = GREATEST(0, xp - ?) WHERE id = ?",
            [xpLost, req.userId]
        )

        res.json({ message: "Task undone", xpLost })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error" })
    }
})

module.exports = router