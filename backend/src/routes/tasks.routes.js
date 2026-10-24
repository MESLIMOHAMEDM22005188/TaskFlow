const express = require("express")
const db = require("../config/db")
const { updateAchievements } = require("../services/achievement.service")

const router = express.Router()

router.get("/", async (req, res) => {
    const requestId = req.get("X-Request-Id") || `tasks-${Date.now().toString(36)}`
    const userId = req.userId

    try {
        const today = new Date().toISOString().slice(0, 10)

        console.info("[Grindly:Tasks]", requestId, "GET /tasks start", { userId, today })

        // Charger les tâches sans dépendre des tables auxiliaires de complétion.
        // Les anciennes tâches peuvent avoir le statut "todo" au lieu de "active".
        const [tasks] = await db.execute(`
            SELECT
                t.*,
                th.name AS theme_name,
                th.emoji AS theme_emoji,
                th.color AS theme_color
            FROM tasks t
            LEFT JOIN themes th ON th.id = t.theme_id
            WHERE t.user_id = ?
              AND LOWER(COALESCE(t.status, 'active')) NOT IN ('archived', 'deleted')
              AND COALESCE(t.is_archived, 0) = 0
            ORDER BY
                FIELD(LOWER(COALESCE(t.priority, 'medium')), 'high', 'medium', 'low'),
                t.deadline IS NULL ASC,
                t.deadline ASC,
                t.created_at DESC
        `, [userId])

        console.info("[Grindly:Tasks]", requestId, "base task rows", {
            userId,
            count: tasks.length,
            ids: tasks.map(task => task.id),
        })

        if (tasks.length === 0) return res.json([])

        const taskIds = tasks.map(task => task.id)
        const placeholders = taskIds.map(() => "?").join(",")
        const [taskThemes] = await db.execute(`
            SELECT tt.task_id, th.id, th.name, th.emoji, th.color
            FROM task_themes tt
            JOIN themes th ON th.id = tt.theme_id
            WHERE tt.task_id IN (${placeholders})
        `, taskIds)

        const themesByTask = {}
        for (const theme of taskThemes) {
            if (!themesByTask[theme.task_id]) themesByTask[theme.task_id] = []
            themesByTask[theme.task_id].push({
                id: theme.id,
                name: theme.name,
                emoji: theme.emoji,
                color: theme.color,
            })
        }

        // Les métadonnées quotidiennes ne doivent pas empêcher l'affichage des tâches.
        let dailyByTask = {}
        try {
            const [dailyRows] = await db.execute(`
                SELECT task_id, count AS today_count, done AS done_today
                FROM task_daily_state
                WHERE user_id = ? AND date = ? AND task_id IN (${placeholders})
            `, [userId, today, ...taskIds])
            dailyByTask = Object.fromEntries(dailyRows.map(row => [
                row.task_id,
                {
                    today_count: Number(row.today_count) || 0,
                    done_today: Boolean(row.done_today),
                },
            ]))
        } catch (dailyError) {
            console.warn("[Grindly:Tasks]", requestId, "daily-state metadata unavailable", dailyError.message)
        }

        const result = tasks.map(task => {
            const normalizedStatus = String(task.status || "active").toLowerCase()
            return {
                ...task,
                status: normalizedStatus === "todo" ? "active" : normalizedStatus,
                today_count: dailyByTask[task.id]?.today_count ?? 0,
                done_today: dailyByTask[task.id]?.done_today ?? false,
                themes: themesByTask[task.id] ?? [],
            }
        })

        console.info("[Grindly:Tasks]", requestId, "GET /tasks success", {
            userId,
            count: result.length,
        })
        return res.json(result)
    } catch (err) {
        console.error("[Grindly:Tasks]", requestId, "GET /tasks failed", {
            userId,
            message: err.message,
            code: err.code,
            sqlMessage: err.sqlMessage,
            stack: err.stack,
        })
        return res.status(500).json({ message: "Error fetching tasks", requestId })
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

        // Force un statut visible dans la liste après rechargement.
        // La route GET ne retourne que les tâches active/done : ne pas dépendre
        // du statut par défaut défini dans le schéma SQL.
        const [result] = await db.execute(
            `INSERT INTO tasks (user_id, theme_id, title, priority, frequency, deadline, note, completion_target, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [req.userId, mainThemeId, title, priority || "Medium", frequency || "daily", deadline || null, note || null, completion_target || 1]
        )

        const taskId = result.insertId

        // Insérer tous les thèmes dans task_themes
        if (ids.length > 0) {
            const placeholders = ids.map(() => "(?, ?)").join(", ")
            const params = ids.flatMap((themeId) => [taskId, themeId])
            await db.execute(
                `INSERT IGNORE INTO task_themes (task_id, theme_id) VALUES ${placeholders}`,
                params
            )
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
                    WHEN frequency = 'once'
                         AND (completions_count + 1) >= completion_target THEN 'done'
                    ELSE 'active'
                END,
                completed_at = CASE
                    WHEN frequency = 'once'
                         AND (completions_count + 1) >= completion_target THEN NOW()
                    ELSE NULL
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

router.put("/:id/restore", async (req, res) => {
    try {
        const [result] = await db.execute(
            "UPDATE tasks SET status = 'active', archived_at = NULL, completed_at = NULL WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )
        if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" })
        const [[task]] = await db.execute("SELECT * FROM tasks WHERE id = ?", [req.params.id])
        res.json(task)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error restoring task" })
    }
})

router.delete("/:id/permanent", async (req, res) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )
        if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" })
        res.json({ message: "Task permanently deleted" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error deleting task" })
    }
})

module.exports = router
