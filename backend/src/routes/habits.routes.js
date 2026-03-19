const express = require("express")
const db = require("../config/db")

const router = express.Router()

// GET toutes les habitudes de l'user
router.get("/", async (req, res) => {
    const [habits] = await db.execute(
        "SELECT * FROM habits WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC",
        [req.userId]
    )

    // Pour chaque habitude, calcule le streak et les infos
    const result = []
    for (const habit of habits) {
        const [logs] = await db.execute(
            "SELECT * FROM habit_logs WHERE habit_id = ? ORDER BY logged_at DESC",
            [habit.id]
        )

        const successLogs = logs.filter(l => l.type === "success").map(l => l.logged_at.toISOString().split("T")[0])
        const lastRelapse = logs.find(l => l.type === "relapse")

        // Calcul streak
        let streak = 0
        const today = new Date()
        for (let i = 0; i <= 365; i++) {
            const d = new Date(today)
            d.setDate(today.getDate() - i)
            const key = d.toISOString().split("T")[0]
            if (successLogs.includes(key)) {
                streak++
            } else if (i > 0) {
                break
            }
        }

        // Meilleur streak
        let bestStreak = 0
        let tempStreak = 0
        const sortedLogs = [...successLogs].sort()
        for (let i = 0; i < sortedLogs.length; i++) {
            if (i === 0) {
                tempStreak = 1
            } else {
                const prev = new Date(sortedLogs[i - 1])
                const curr = new Date(sortedLogs[i])
                const diff = (curr.getTime() - prev.getTime()) / 86400000
                if (diff === 1) {
                    tempStreak++
                } else {
                    bestStreak = Math.max(bestStreak, tempStreak)
                    tempStreak = 1
                }
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak)

        const doneToday = successLogs.includes(today.toISOString().split("T")[0])
        const relapseCount = logs.filter(l => l.type === "relapse").length

        result.push({
            ...habit,
            streak,
            bestStreak,
            doneToday,
            relapseCount,
            lastRelapse: lastRelapse?.logged_at ?? null,
            totalSuccess: successLogs.length
        })
    }

    res.json(result)
})

// POST créer une habitude
router.post("/", async (req, res) => {
    const {
        name, type, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level
    } = req.body

    const [result] = await db.execute(`
        INSERT INTO habits (
            user_id, name, type, category, emoji, color,
            frequency, difficulty, reminder_time,
            is_private, motivation, triggers,
            relapse_plan, danger_level
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        req.userId, name, type || "build", category || "other",
        emoji || null, color || "#6366f1", frequency || "daily",
        difficulty || "medium", reminder_time || null,
        is_private || false, motivation || null,
        triggers || null, relapse_plan || null,
        danger_level || "low"
    ])

    const [rows] = await db.execute("SELECT * FROM habits WHERE id = ?", [result.insertId])
    res.json({ ...rows[0], streak: 0, bestStreak: 0, doneToday: false, relapseCount: 0 })
})

// PUT modifier une habitude
router.put("/:id", async (req, res) => {
    const {
        name, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level
    } = req.body

    await db.execute(`
        UPDATE habits SET
            name = ?, category = ?, emoji = ?, color = ?,
            frequency = ?, difficulty = ?, reminder_time = ?,
            is_private = ?, motivation = ?, triggers = ?,
            relapse_plan = ?, danger_level = ?
        WHERE id = ? AND user_id = ?
    `, [
        name, category, emoji, color,
        frequency, difficulty, reminder_time || null,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
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

    try {
        await db.execute(
            "INSERT INTO habit_logs (habit_id, user_id, type, note) VALUES (?, ?, 'success', ?)",
            [req.params.id, req.userId, note || null]
        )
    } catch {
        return res.status(400).json({ message: "Already logged today" })
    }

    // XP selon difficulté
    const xpMap = { easy: 5, medium: 15, hard: 30, extreme: 50 }
    const [habits] = await db.execute("SELECT * FROM habits WHERE id = ?", [req.params.id])
    const xp = xpMap[habits[0]?.difficulty] ?? 15

    await db.execute(
        "UPDATE users SET xp = xp + ? WHERE id = ?",
        [xp, req.userId]
    )

    // Vérifie milestones
    const [logs] = await db.execute(
        "SELECT * FROM habit_logs WHERE habit_id = ? AND type = 'success' ORDER BY logged_at DESC",
        [req.params.id]
    )

    const milestones = [7, 30, 90, 180, 365]
    for (const days of milestones) {
        if (logs.length === days) {
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

    res.json({ message: "Success logged", xpGained: xp })
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

// DELETE undone today
router.delete("/:id/success", async (req, res) => {
    await db.execute(
        "DELETE FROM habit_logs WHERE habit_id = ? AND user_id = ? AND type = 'success' AND logged_at = CURRENT_DATE",
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