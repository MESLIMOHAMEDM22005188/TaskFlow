const express = require("express")
const db = require("../config/db")

const router = express.Router()

// GET toutes les habitudes de l'user
router.get("/", async (req, res) => {
    const [habits] = await db.execute(
        "SELECT * FROM habits WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC",
        [req.userId]
    )

    if (habits.length === 0) return res.json([])

    const habitIds = habits.map(h => h.id)
    const placeholders = habitIds.map(() => "?").join(",")

    const [allLogs] = await db.execute(
        `SELECT * FROM habit_logs WHERE habit_id IN (${placeholders}) ORDER BY logged_at DESC`,
        habitIds
    )

    const today = new Date().toISOString().split("T")[0]

    const result = habits.map(habit => {
        const logs = allLogs.filter(l => l.habit_id === habit.id)

        // ✅ FIX: on déduplique par date (un log par jour, peu importe times_per_day)
        // pour le calcul du streak et bestStreak
        const successLogs = logs
            .filter(l => l.type === "success")
            .map(l => l.logged_at instanceof Date
                ? l.logged_at.toISOString().split("T")[0]
                : String(l.logged_at).split("T")[0]
            )

        // Dates uniques uniquement pour le streak
        const uniqueSuccessDates = [...new Set(successLogs)]

        const lastRelapse = logs.find(l => l.type === "relapse")

        // ✅ FIX: streak basé sur les dates uniques, pas le count total de logs
        let streak = 0
        const now = new Date()
        for (let i = 0; i <= 365; i++) {
            const d = new Date(now)
            d.setDate(now.getDate() - i)
            const key = d.toISOString().split("T")[0]
            if (uniqueSuccessDates.includes(key)) streak++
            else if (i > 0) break
        }

        let bestStreak = 0
        let tempStreak = 0
        const sortedUniqueDates = [...uniqueSuccessDates].sort()
        for (let i = 0; i < sortedUniqueDates.length; i++) {
            if (i === 0) {
                tempStreak = 1
            } else {
                const diff = (new Date(sortedUniqueDates[i]).getTime() - new Date(sortedUniqueDates[i - 1]).getTime()) / 86400000
                if (diff === 1) tempStreak++
                else { bestStreak = Math.max(bestStreak, tempStreak); tempStreak = 1 }
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak)

        // ✅ FIX: todayCount = nombre de logs "success" aujourd'hui (pas dédupliqué —
        // on veut savoir combien de fois l'user a cliqué aujourd'hui vs times_per_day)
        const todayCount = successLogs.filter(d => d === today).length
        const relapseCount = logs.filter(l => l.type === "relapse").length

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayKey = yesterday.toISOString().split("T")[0]
        const yesterdayCount = successLogs.filter(d => d === yesterdayKey).length
        const hadSparkYesterday = yesterdayCount > 0 && yesterdayCount < (habit.times_per_day ?? 1)

        return {
            ...habit,
            streak,
            bestStreak,
            doneToday: todayCount >= (habit.times_per_day ?? 1),
            todayCount,
            relapseCount,
            lastRelapse: lastRelapse?.logged_at ?? null,
            totalSuccess: uniqueSuccessDates.length, // jours uniques réussis
            // ✅ FIX: habit.spark_count (singulier) et non habits.spark_count
            sparkCount: habit.spark_count ?? 0,
            hadSparkYesterday
        }
    })

    res.json(result)
})

// POST créer une habitude
router.post("/", async (req, res) => {
    const {
        name, type, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day, start_date
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

    const [rows] = await db.execute("SELECT * FROM habits WHERE id = ?", [result.insertId])
    res.json({ ...rows[0], streak: 0, bestStreak: 0, doneToday: false, todayCount: 0, relapseCount: 0, sparkCount: 0 })
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

    await db.execute(
        "INSERT INTO habit_logs (habit_id, user_id, type, note) VALUES (?, ?, 'success', ?)",
        [req.params.id, req.userId, note || null]
    )

    // ✅ FIX: DATE(logged_at) = CURDATE() au lieu de logged_at = CURRENT_DATE
    // CURRENT_DATE compare un DATETIME à une DATE, ce qui échoue si logged_at a une heure
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
        // ✅ FIX: COUNT(DISTINCT DATE(logged_at)) pour compter les jours uniques réussis
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