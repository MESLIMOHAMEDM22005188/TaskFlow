const express = require("express")
const db = require("../config/db")

const router = express.Router()

// GET settings de l'user
router.get("/settings", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM flow_settings WHERE user_id = ?",
        [req.userId]
    )

    if (rows.length === 0) {
        // Crée les settings par défaut
        await db.execute(
            "INSERT INTO flow_settings (user_id) VALUES (?)",
            [req.userId]
        )
        const [newRows] = await db.execute(
            "SELECT * FROM flow_settings WHERE user_id = ?",
            [req.userId]
        )
        return res.json(newRows[0])
    }

    res.json(rows[0])
})

// PUT mettre à jour les settings
router.put("/settings", async (req, res) => {
    const { focus_duration, short_break, long_break, pomodoros_until_long, auto_start_break, ambient_sound, ambient_volume } = req.body

    await db.execute(`
        INSERT INTO flow_settings (user_id, focus_duration, short_break, long_break, pomodoros_until_long, auto_start_break, ambient_sound, ambient_volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            focus_duration = VALUES(focus_duration),
            short_break = VALUES(short_break),
            long_break = VALUES(long_break),
            pomodoros_until_long = VALUES(pomodoros_until_long),
            auto_start_break = VALUES(auto_start_break),
            ambient_sound = VALUES(ambient_sound),
            ambient_volume = VALUES(ambient_volume)
    `, [req.userId, focus_duration, short_break, long_break, pomodoros_until_long, auto_start_break, ambient_sound, ambient_volume])

    const [rows] = await db.execute(
        "SELECT * FROM flow_settings WHERE user_id = ?",
        [req.userId]
    )
    res.json(rows[0])
})

// POST sauvegarder une session terminée
router.post("/sessions", async (req, res) => {
    const { task_id, duration_minutes, type, completed } = req.body

    // XP bonus selon type et complétion
    let xpGained = 0
    if (completed && type === "focus") {
        xpGained = Math.round(duration_minutes * 2) // 2 XP par minute de focus
    }

    const [result] = await db.execute(
        "INSERT INTO flow_sessions (user_id, task_id, duration_minutes, type, completed, xp_gained) VALUES (?, ?, ?, ?, ?, ?)",
        [req.userId, task_id || null, duration_minutes, type || "focus", completed, xpGained]
    )

    if (xpGained > 0) {
        await db.execute(
            "UPDATE users SET xp = xp + ? WHERE id = ?",
            [xpGained, req.userId]
        )
    }

    const [rows] = await db.execute(
        "SELECT * FROM flow_sessions WHERE id = ?",
        [result.insertId]
    )
    res.json({ ...rows[0], xpGained })
})

// GET stats de l'user
router.get("/stats", async (req, res) => {

    const [[{ todaySessions }]] = await db.execute(
        "SELECT COUNT(*) as todaySessions FROM flow_sessions WHERE user_id = ? AND type = 'focus' AND completed = TRUE AND DATE(created_at) = CURRENT_DATE",
        [req.userId]
    )

    const [[{ todayMinutes }]] = await db.execute(
        "SELECT COALESCE(SUM(duration_minutes), 0) as todayMinutes FROM flow_sessions WHERE user_id = ? AND type = 'focus' AND completed = TRUE AND DATE(created_at) = CURRENT_DATE",
        [req.userId]
    )

    const [[{ totalSessions }]] = await db.execute(
        "SELECT COUNT(*) as totalSessions FROM flow_sessions WHERE user_id = ? AND type = 'focus' AND completed = TRUE",
        [req.userId]
    )

    const [[{ totalMinutes }]] = await db.execute(
        "SELECT COALESCE(SUM(duration_minutes), 0) as totalMinutes FROM flow_sessions WHERE user_id = ? AND type = 'focus' AND completed = TRUE",
        [req.userId]
    )

    res.json({
        todaySessions,
        todayMinutes,
        totalSessions,
        totalMinutes
    })
})

module.exports = router