const express = require("express")
const db = require("../config/db")

const router = express.Router()

// GET stats générales
router.get("/overview", async (req, res) => {
    const [[{ totalTasks }]] = await db.execute(
        "SELECT COUNT(*) as totalTasks FROM task_completions WHERE user_id = ?",
        [req.userId]
    )

    const [[{ totalXp }]] = await db.execute(
        "SELECT COALESCE(xp, 0) as totalXp FROM users WHERE id = ?",
        [req.userId]
    )

    const [[{ totalFocus }]] = await db.execute(
        "SELECT COALESCE(SUM(duration_minutes), 0) as totalFocus FROM flow_sessions WHERE user_id = ? AND type = 'focus' AND completed = TRUE",
        [req.userId]
    )

    const [[{ bestStreak }]] = await db.execute(`
        SELECT MAX(streak) as bestStreak FROM (
            SELECT COUNT(*) as streak
            FROM (
                SELECT completed_at,
                       DATE_SUB(completed_at, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_at) DAY) as grp
                FROM (SELECT DISTINCT completed_at FROM task_completions WHERE user_id = ?) t
            ) grouped
            GROUP BY grp
        ) streaks
    `, [req.userId])

    const [[{ bestDay }]] = await db.execute(`
        SELECT DATE_FORMAT(completed_at, '%W') as bestDay
        FROM task_completions
        WHERE user_id = ?
        GROUP BY DAY(completed_at), DATE_FORMAT(completed_at, '%W')
        ORDER BY COUNT(*) DESC
        LIMIT 1
    `, [req.userId])

    const [[{ bestHour }]] = await db.execute(`
        SELECT HOUR(completed_at) as bestHour
        FROM task_completions
        WHERE user_id = ?
        GROUP BY HOUR(completed_at)
        ORDER BY COUNT(*) DESC
            LIMIT 1
    `, [req.userId])

    res.json({
        totalTasks,
        totalXp,
        totalFocus,
        bestStreak: bestStreak ?? 0,
        bestDay: bestDay ?? "—",
        bestHour: bestHour ?? null
    })
})

// GET tâches par jour (heatmap + barres)
router.get("/tasks-per-day", async (req, res) => {
    const { period } = req.query // 7, 30, 365

    const days = period === "year" ? 365 : period === "month" ? 30 : 7

    const [rows] = await db.execute(`
        SELECT 
            DATE_FORMAT(completed_at, '%Y-%m-%d') as date,
            COUNT(*) as count
        FROM task_completions
        WHERE user_id = ? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
        ORDER BY date ASC
    `, [req.userId, days])

    res.json(rows)
})

// GET XP par semaine/mois
router.get("/xp-over-time", async (req, res) => {
    const { period } = req.query

    let groupBy, interval
    if (period === "year") {
        groupBy = "DATE_FORMAT(created_at, '%Y-%m')"
        interval = "12 MONTH"
    } else if (period === "month") {
        groupBy = "DATE_FORMAT(created_at, '%Y-%u')"
        interval = "1 MONTH"
    } else {
        groupBy = "DATE_FORMAT(created_at, '%Y-%m-%d')"
        interval = "7 DAY"
    }

    const [rows] = await db.execute(`
        SELECT 
            ${groupBy} as period,
            SUM(xp_gained) as xp
        FROM flow_sessions
        WHERE user_id = ? AND completed = TRUE AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
        GROUP BY ${groupBy}
        ORDER BY period ASC
    `, [req.userId])

    res.json(rows)
})

// GET radar par thème
router.get("/radar", async (req, res) => {
    const [themes] = await db.execute(
        "SELECT * FROM themes WHERE user_id = ?",
        [req.userId]
    )

    const radarData = await Promise.all(themes.map(async theme => {
        const [[{ taskCount }]] = await db.execute(
            "SELECT COUNT(*) as taskCount FROM tasks WHERE user_id = ? AND theme_id = ?",
            [req.userId, theme.id]
        )
        const [[{ completedCount }]] = await db.execute(`
            SELECT COUNT(*) as completedCount 
            FROM task_completions tc
            JOIN tasks t ON t.id = tc.task_id
            WHERE tc.user_id = ? AND t.theme_id = ?
        `, [req.userId, theme.id])

        return {
            theme: theme.name,
            color: theme.color,
            emoji: theme.emoji,
            tasks: taskCount,
            completed: completedCount,
        }
    }))

    res.json(radarData)
})

// GET répartition par priorité
router.get("/priority-split", async (req, res) => {
    const [rows] = await db.execute(`
        SELECT 
            t.priority,
            COUNT(*) as count
        FROM task_completions tc
        JOIN tasks t ON t.id = tc.task_id
        WHERE tc.user_id = ?
        GROUP BY t.priority
    `, [req.userId])

    res.json(rows)
})

// GET focus par jour
router.get("/focus-per-day", async (req, res) => {
    const { period } = req.query
    const days = period === "year" ? 365 : period === "month" ? 30 : 7

    const [rows] = await db.execute(`
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m-%d') as date,
            SUM(duration_minutes) as minutes
        FROM flow_sessions
        WHERE user_id = ? AND type = 'focus' AND completed = TRUE
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
    `, [req.userId, days])

    res.json(rows)
})

// GET heatmap 365 jours
router.get("/heatmap", async (req, res) => {
    const [rows] = await db.execute(`
        SELECT 
            DATE_FORMAT(completed_at, '%Y-%m-%d') as date,
            COUNT(*) as count
        FROM task_completions
        WHERE user_id = ? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
        ORDER BY date ASC
    `, [req.userId])

    res.json(rows)
})

module.exports = router