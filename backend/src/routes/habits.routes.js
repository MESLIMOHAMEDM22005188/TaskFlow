const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        console.log("userId =", req.userId)

        const [rows] = await db.execute(
            `
            SELECT
                id,
                name,
                emoji,
                color,
                is_default
            FROM themes
            WHERE is_default = 1
               OR user_id = ?
            ORDER BY is_default DESC, created_at DESC
            `,
            [req.userId]
        )

        console.log(rows)

        res.json(rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching themes" })
    }
})
router.post("/", async (req, res) => {
    const {
        name, type, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day, start_date,
        theme_ids  // ← ajoute ça
    } = req.body

    const [result] = await db.execute(`
        INSERT INTO habits (
            user_id, name, type, category, emoji, color,
            frequency, difficulty, reminder_time,
            is_private, motivation, triggers,
            relapse_plan, danger_level, times_per_day, start_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        req.userId, name, type || "build", category || "other",
        emoji || null, color || "#6366f1", frequency || "daily",
        difficulty || "medium", reminder_time || null,
        is_private || false, motivation || null,
        triggers || null, relapse_plan || null,
        danger_level || "low", times_per_day || 1,
        start_date || null
    ])

    const habitId = result.insertId

    // ← insère les thèmes (max 3)
    if (Array.isArray(theme_ids) && theme_ids.length > 0) {
        const limitedThemes = theme_ids.slice(0, 3)
        for (const themeId of limitedThemes) {
            await db.execute(
                "INSERT IGNORE INTO habit_themes (habit_id, theme_id) VALUES (?, ?)",
                [habitId, themeId]
            )
        }
    }

    const [rows] = await db.execute("SELECT * FROM habits WHERE id = ?", [habitId])
    res.json({ ...rows[0], streak: 0, bestStreak: 0, doneToday: false, todayCount: 0, relapseCount: 0, sparkCount: 0, theme_ids: theme_ids?.slice(0, 3) ?? [] })
})

// PUT modifier une habitude
router.put("/:id", async (req, res) => {
    const {
        name, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day, start_date
    } = req.body

    await db.execute(`
        UPDATE habits SET
            name = ?, category = ?, emoji = ?, color = ?,
            frequency = ?, difficulty = ?, reminder_time = ?,
            is_private = ?, motivation = ?, triggers = ?,
            relapse_plan = ?, danger_level = ?,
            times_per_day = ?, start_date = ?
        WHERE id = ? AND user_id = ?
    `, [
        name, category, emoji, color,
        frequency, difficulty, reminder_time || null,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day || 1, start_date || null,
        req.params.id, req.userId
    ])

    const [rows] = await db.execute("SELECT * FROM habits WHERE id = ?", [req.params.id])
    res.json(rows[0])
})

// DELETE archiver une habitude
router.delete("/:id", async (req, res) => {
    await db.execute(
        "UPDATE habits SET is_active = FALSE WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )
    res.json({ message: "Habit archived" })
})

// POST log success
router.post("/:id/success", async (req, res) => {
    const { note } = req.body

    const [habits] = await db.execute("SELECT * FROM habits WHERE id = ?", [req.params.id])
    if (habits.length === 0) return res.status(404).json({ message: "Habit not found" })

    const habit = habits[0]
    const timesPerDay = habit.times_per_day ?? 1

    // ✅ Vérification AVANT d'insérer — bloque si déjà complet aujourd'hui
    const [[{ todayCount: currentCount }]] = await db.execute(
        `SELECT COUNT(*) as todayCount
         FROM habit_logs
         WHERE habit_id = ?
           AND user_id = ?
           AND type = 'success'
           AND DATE(logged_at) = CURDATE()`,
        [req.params.id, req.userId]
    )

    if (currentCount >= timesPerDay) {
        return res.status(400).json({
            message: "Already completed today",
            todayCount: currentCount,
            isFullDay: true
        })
    }

    // Insert le log
    await db.execute(
        "INSERT INTO habit_logs (habit_id, user_id, type, note) VALUES (?, ?, 'success', ?)",
        [req.params.id, req.userId, note || null]
    )

    // Recompte après insert
    const [[{ todayCount }]] = await db.execute(
        `SELECT COUNT(*) as todayCount
         FROM habit_logs
         WHERE habit_id = ?
           AND user_id = ?
           AND type = 'success'
           AND DATE(logged_at) = CURDATE()`,
        [req.params.id, req.userId]
    )

    const isFullDay = todayCount >= timesPerDay
    const xpMap = { easy: 5, medium: 15, hard: 30, extreme: 50 }
    const fullXp = xpMap[habit.difficulty] ?? 15

    let xpGained = 0
    let isSpark = false

    if (isFullDay) {
        xpGained = fullXp
        await db.execute(
            "UPDATE habits SET spark_count = 0 WHERE id = ?",
            [req.params.id]
        )
    } else if (todayCount === 1) {
        xpGained = Math.round(fullXp * 0.2)
        isSpark = true
    }

    if (xpGained > 0) {
        await db.execute(
            "UPDATE users SET xp = xp + ? WHERE id = ?",
            [xpGained, req.userId]
        )
    }

    if (isFullDay) {
        const [[{ count }]] = await db.execute(
            `SELECT COUNT(DISTINCT DATE(logged_at)) as count
             FROM habit_logs
             WHERE habit_id = ? AND type = 'success'`,
            [req.params.id]
        )
        const milestones = [7, 30, 90, 180, 365]
        for (const days of milestones) {
            if (count === days) {
                const [existing] = await db.execute(
                    "SELECT * FROM habit_milestones WHERE habit_id = ? AND days = ?",
                    [req.params.id, days]
                )
                if (existing.length === 0) {
                    await db.execute(
                        "INSERT INTO habit_milestones (habit_id, user_id, days) VALUES (?, ?, ?)",
                        [req.params.id, req.userId, days]
                    )
                }
            }
        }
    }

    res.json({ message: "Success logged", xpGained, isSpark, todayCount, isFullDay })
})

// POST log relapse
router.post("/:id/relapse", async (req, res) => {
    const { note } = req.body

    await db.execute(
        "INSERT INTO habit_logs (habit_id, user_id, type, note) VALUES (?, ?, 'relapse', ?)",
        [req.params.id, req.userId, note || null]
    )

    res.json({ message: "Relapse logged" })
})

// DELETE undo today's last success
router.delete("/:id/success", async (req, res) => {
    // ✅ FIX: DATE(logged_at) = CURDATE() ici aussi
    await db.execute(
        `DELETE FROM habit_logs
         WHERE habit_id = ?
           AND user_id = ?
           AND type = 'success'
           AND DATE(logged_at) = CURDATE()
         ORDER BY logged_at DESC
         LIMIT 1`,
        [req.params.id, req.userId]
    )
    res.json({ message: "Success removed" })
})

// GET heatmap d'une habitude
router.get("/:id/heatmap", async (req, res) => {
    const [logs] = await db.execute(`
        SELECT
            DATE_FORMAT(logged_at, '%Y-%m-%d') as date,
            type
        FROM habit_logs
        WHERE habit_id = ? AND user_id = ? AND logged_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        ORDER BY logged_at ASC
    `, [req.params.id, req.userId])

    res.json(logs)
})

// GET milestones d'une habitude
router.get("/:id/milestones", async (req, res) => {
    const [milestones] = await db.execute(
        "SELECT * FROM habit_milestones WHERE habit_id = ? AND user_id = ? ORDER BY days ASC",
        [req.params.id, req.userId]
    )
    res.json(milestones)
})

module.exports = router