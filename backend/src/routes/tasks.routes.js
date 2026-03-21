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
            WHERE t.user_id = ? AND t.status IN ('active', 'done')
            ORDER BY
                FIELD(t.priority, 'High', 'Medium', 'Low'),
                t.deadline ASC,
                t.created_at DESC
        `, [req.userId, today, req.userId])

        if (tasks.length === 0) return res.json([])

        // Charger les thèmes multi depuis task_themes
        const taskIds = tasks.map(t => t.id)
        const placeholders = taskIds.map(() => "?").join(",")
        const [taskThemes] = await db.execute(`
            SELECT tt.task_id, th.id, th.name, th.emoji, th.color
            FROM task_themes tt
            JOIN themes th ON th.id = tt.theme_id
            WHERE tt.task_id IN (${placeholders})
        `, taskIds)

        const themesByTask = {}
        taskThemes.forEach(tt => {
            if (!themesByTask[tt.task_id]) themesByTask[tt.task_id] = []
            themesByTask[tt.task_id].push({ id: tt.id, name: tt.name, emoji: tt.emoji, color: tt.color })
        })

        // Ajouter themes[] à chaque tâche
        const result = tasks.map(t => ({
            ...t,
            themes: themesByTask[t.id] ?? []
        }))

        res.json(result)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching tasks" })
    }
})

router.post("/", async (req, res) => {
    try {
        const { title, priority, theme_id, theme_ids, frequency, deadline, note, completion_target } = req.body

        // Construire la liste des ids — priorité à theme_ids, fallback sur theme_id
        const ids = Array.isArray(theme_ids) && theme_ids.length > 0
            ? theme_ids.slice(0, 3)
            : (theme_id ? [theme_id] : [])

        // On garde theme_id sur la tâche pour la compatibilité
        const mainThemeId = ids[0] ?? theme_id ?? null

        const [result] = await db.execute(
            `INSERT INTO tasks (user_id, theme_id, title, priority, frequency, deadline, note, completion_target)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.userId, mainThemeId, title, priority || "Medium", frequency || "daily", deadline || null, note || null, completion_target || 1]
        )

        const taskId = result.insertId

        // Insérer tous les thèmes dans task_themes
        if (ids.length > 0) {
            const themeValues = ids.map(tid => [taskId, tid])
            await db.query("INSERT IGNORE INTO task_themes (task_id, theme_id) VALUES ?", [themeValues])
        }

        const [[task]] = await db.execute("SELECT * FROM tasks WHERE id = ?", [taskId])

        const [themes] = ids.length > 0
            ? await db.execute(
                `SELECT id, name, emoji, color FROM themes WHERE id IN (${ids.map(() => "?").join(",")})`,
                ids
            )
            : [[], []]

        res.json({ ...task, themes })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error creating task" })
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