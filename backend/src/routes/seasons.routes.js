const express = require("express")
const db = require("../config/db")

const router = express.Router()

function getSeasonRange(season, year) {
    const normalized = String(season || "").toLowerCase()
    const startYear = Number(year)
    if (!Number.isInteger(startYear) || startYear < 2020 || startYear > 2100) {
        const error = new Error("Invalid season year")
        error.status = 400
        throw error
    }
    if (normalized === "winter") {
        return { label: "Winter Arc", start: `${startYear}-11-01 00:00:00`, end: `${startYear + 1}-02-01 00:00:00` }
    }
    if (normalized === "summer") {
        return { label: "Summer Arc", start: `${startYear}-06-01 00:00:00`, end: `${startYear}-09-01 00:00:00` }
    }
    const error = new Error("Unknown season")
    error.status = 400
    throw error
}

function rankForXp(value) {
    const xp = Number(value) || 0
    if (xp >= 7500) return "Eternal"
    if (xp >= 5000) return "Aurora"
    if (xp >= 3000) return "Glacier"
    if (xp >= 1500) return "Blizzard"
    if (xp >= 500) return "Frost"
    return "Frozen"
}

router.get("/:season/:year", async (req, res) => {
    try {
        const range = getSeasonRange(req.params.season, req.params.year)
        const [rows] = await db.execute(`
            SELECT
                u.id AS user_id,
                u.username,
                u.avatar_url,
                COALESCE(SUM(activity.xp), 0) AS season_xp,
                COUNT(activity.activity_date) AS actions_count,
                COUNT(DISTINCT activity.activity_date) AS active_days
            FROM users u
            LEFT JOIN (
                SELECT user_id, DATE(completed_at) AS activity_date, 10 AS xp
                FROM task_completions
                WHERE completed_at >= ? AND completed_at < ?
                UNION ALL
                SELECT user_id, DATE(created_at) AS activity_date, xp_gained AS xp
                FROM flow_sessions
                WHERE completed = TRUE AND created_at >= ? AND created_at < ?
                UNION ALL
                SELECT hl.user_id, DATE(hl.logged_at) AS activity_date,
                    CASE h.difficulty
                        WHEN 'easy' THEN 5
                        WHEN 'medium' THEN 15
                        WHEN 'hard' THEN 30
                        WHEN 'extreme' THEN 50
                        ELSE 15
                    END AS xp
                FROM habit_logs hl
                JOIN habits h ON h.id = hl.habit_id
                WHERE hl.type = 'success' AND hl.logged_at >= ? AND hl.logged_at < ?
            ) activity ON activity.user_id = u.id
            WHERE COALESCE(u.privacy_appear_leaderboard, 1) = 1
            GROUP BY u.id, u.username, u.avatar_url
            HAVING season_xp > 0 OR u.id = ?
            ORDER BY season_xp DESC, active_days DESC, u.username ASC
            LIMIT 100
        `, [range.start, range.end, range.start, range.end, range.start, range.end, req.userId])

        const leaderboard = rows.map((row, index) => ({
            rank: index + 1,
            userId: Number(row.user_id),
            username: row.username,
            avatarUrl: row.avatar_url || null,
            xp: Number(row.season_xp) || 0,
            actions: Number(row.actions_count) || 0,
            activeDays: Number(row.active_days) || 0,
            division: rankForXp(row.season_xp),
            isMe: Number(row.user_id) === Number(req.userId),
        }))

        const me = leaderboard.find(entry => entry.isMe) || null
        res.json({
            season: range.label,
            seasonKey: req.params.season.toLowerCase(),
            year: Number(req.params.year),
            startsAt: range.start,
            endsAt: range.end,
            leaderboard,
            me,
        })
    } catch (err) {
        if (err.status === 400) return res.status(400).json({ message: err.message })
        console.error("[Grindly:Seasons]", err)
        res.status(500).json({ message: "Unable to load seasonal leaderboard" })
    }
})

module.exports = router
