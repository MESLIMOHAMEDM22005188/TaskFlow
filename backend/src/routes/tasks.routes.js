const express = require("express")
const db = require("../config/db")
const { updateAchievements } = require("../services/achievement.service")

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0]

        const [tasks] = await db.execute(`
            SELECT
                t.*,
                COALESCE(ds.count, 0) as today_count,
                COALESCE(ds.done, FALSE) as done_today,
                th.name as theme_name,
                th.emoji as theme_emoji,
                th.color as theme_color
            FROM tasks t
            LEFT JOIN task_daily_state ds
                ON ds.task_id = t.id
                AND ds.user_id = ?
                AND ds.date = ?
            LEFT JOIN themes th ON th.id = t.theme_id
            WHERE t.user_id = ? AND t.status = 'active'
            ORDER BY
                FIELD(t.priority, 'High', 'Medium', 'Low'),
                t.deadline ASC,
                t.created_at DESC
        `, [req.userId, today, req.userId])

        res.json(tasks)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching tasks" })
    }
})
// CREATE task
router.post("/", async (req, res) => {
    try {
        const { title, priority, theme_id, frequency, deadline, note, completion_target } = req.body

        const [result] = await db.execute(
            `INSERT INTO tasks
             (user_id, theme_id, title, priority, frequency, deadline, note, completion_target)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId,
                theme_id || null,
                title,
                priority || "Medium",
                frequency || "daily",
                deadline || null,
                note || null,
                completion_target || 1
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
        const [result] = await db.execute(
            "UPDATE tasks SET status = 'archived', archived_at = NOW() WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" })
        }

        res.json({ message: "Task archived" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error archiving task" })
    }
})
// GET today completions
router.get("/completions/today", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0]

        const [rows] = await db.execute(`
            SELECT task_id, count as today_count, done as done_today
            FROM task_daily_state
            WHERE user_id = ? AND date = ?
        `, [req.userId, today])

        res.json(rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching completions" })
    }
})

router.get("/history", async (req, res) => {
    try {
        const [tasks] = await db.execute(`
            SELECT
                t.*,
                COUNT(tc.id) as total_completions,
                DATEDIFF(
                    COALESCE(t.completed_at, t.archived_at, NOW()),
                    t.created_at
                ) as lifespan_days,
                th.name  as theme_name,
                th.emoji as theme_emoji,
                th.color as theme_color
            FROM tasks t
            LEFT JOIN task_completions tc ON tc.task_id = t.id
            LEFT JOIN themes th ON th.id = t.theme_id
            WHERE t.user_id = ?
              AND t.status IN ('done', 'archived')
            GROUP BY t.id
            ORDER BY COALESCE(t.completed_at, t.archived_at) DESC
            LIMIT 100
        `, [req.userId])

        res.json(tasks)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching history" })
    }
})
// COMPLETE task
router.post("/:id/complete", async (req, res) => {
    try {
        const taskId = req.params.id
        const today = new Date().toISOString().split("T")[0]

        const [[task]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [taskId, req.userId]
        )
        if (!task) return res.status(404).json({ message: "Task not found" })

        // Upsert daily state
        await db.execute(`
            INSERT INTO task_daily_state (task_id, user_id, date, count, done)
            VALUES (?, ?, ?, 1, (1 >= ?))
            ON DUPLICATE KEY UPDATE
                count = count + 1,
                done  = (count + 1) >= ?
        `, [taskId, req.userId, today, task.completion_target, task.completion_target])

        // Log dans l'historique
        await db.execute(
            "INSERT INTO task_completions (task_id, user_id, completed_at) VALUES (?, ?, NOW())",
            [taskId, req.userId]
        )

        // Incrémente compteur global + transition de statut si seuil atteint
        await db.execute(`
            UPDATE tasks
            SET
                completions_count = completions_count + 1,
                status = CASE
                    WHEN (completions_count + 1) >= completion_target THEN 'done'
                    ELSE status
                END,
                completed_at = CASE
                    WHEN (completions_count + 1) >= completion_target THEN NOW()
                    ELSE completed_at
                END
            WHERE id = ?
        `, [taskId])

        // XP
        await db.execute(
            "UPDATE users SET xp = xp + 10 WHERE id = ?",
            [req.userId]
        )

        // Relit la tâche à jour
        const [[updated]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ?",
            [taskId]
        )

        res.json({ task: updated, xp: 10 })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error completing task" })
    }
})
// UNDO task
router.delete("/:id/complete", async (req, res) => {
    try {
        const taskId = req.params.id
        const today = new Date().toISOString().split("T")[0]

        // Vérifie qu'il y a bien une complétion aujourd'hui
        const [[state]] = await db.execute(
            "SELECT count FROM task_daily_state WHERE task_id = ? AND user_id = ? AND date = ?",
            [taskId, req.userId, today]
        )
        if (!state || state.count === 0) {
            return res.status(400).json({ message: "Nothing to undo today" })
        }

        // Retire une complétion du jour
        await db.execute(`
            UPDATE task_daily_state
            SET count = count - 1,
                done  = FALSE
            WHERE task_id = ? AND user_id = ? AND date = ?
        `, [taskId, req.userId, today])

        // Supprime le dernier log dans l'historique
        await db.execute(`
            DELETE FROM task_completions
            WHERE task_id = ? AND user_id = ?
            ORDER BY completed_at DESC
            LIMIT 1
        `, [taskId, req.userId])

        // Décrémente le compteur global + repasse en active si besoin
        await db.execute(`
            UPDATE tasks
            SET
                completions_count = GREATEST(0, completions_count - 1),
                status = CASE
                    WHEN status = 'done' THEN 'active'
                    ELSE status
                END,
                completed_at = CASE
                    WHEN status = 'done' THEN NULL
                    ELSE completed_at
                END
            WHERE id = ?
        `, [taskId])

        await db.execute(
            "UPDATE users SET xp = GREATEST(0, xp - 10) WHERE id = ?",
            [req.userId]
        )

        const [[updated]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ?",
            [taskId]
        )

        res.json({ task: updated, xp: -10 })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error undoing completion" })
    }
})
module.exports = router