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

    // Compte les jours distincts, pas chaque complétion : plusieurs tâches le même jour
    // ne doivent pas casser ni artificiellement prolonger une série.
    const [[{ bestStreak }]] = await db.execute(`
        SELECT COALESCE(MAX(streak), 0) AS bestStreak
        FROM (
            SELECT COUNT(*) AS streak
            FROM (
                SELECT completed_date,
                       DATE_SUB(completed_date, INTERVAL rn DAY) AS streak_group
                FROM (
                    SELECT completed_date,
                           ROW_NUMBER() OVER (ORDER BY completed_date) AS rn
                    FROM (
                        SELECT DISTINCT DATE(completed_at) AS completed_date
                        FROM task_completions
                        WHERE user_id = ?
                    ) AS distinct_days
                ) AS ordered_days
            ) AS grouped_days
            GROUP BY streak_group
        ) AS streak_groups
    `, [req.userId])

    const [bestDayRows] = await db.execute(`
        SELECT CASE DAYOFWEEK(completed_at)
            WHEN 1 THEN 'Dimanche'
            WHEN 2 THEN 'Lundi'
            WHEN 3 THEN 'Mardi'
            WHEN 4 THEN 'Mercredi'
            WHEN 5 THEN 'Jeudi'
            WHEN 6 THEN 'Vendredi'
            WHEN 7 THEN 'Samedi'
        END AS bestDay
        FROM task_completions
        WHERE user_id = ?
        GROUP BY DAYOFWEEK(completed_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
    `, [req.userId])
    const [bestHourRows] = await db.execute(`
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
        bestDay: bestDayRows[0]?.bestDay ?? "—",
        bestHour: bestHourRows[0]?.bestHour ?? null
    })
})

// GET tâches par jour (heatmap + barres)
router.get("/tasks-per-day", async (req, res) => {
    const { period } = req.query
    const numberOfDays = period === "year" ? 365 : period === "month" ? 30 : 7
    const lookbackDays = numberOfDays - 1

    const [rows] = await db.execute(`
        SELECT
            DATE_FORMAT(completed_at, '%Y-%m-%d') AS date,
            COUNT(*) AS count
        FROM task_completions
        WHERE user_id = ? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
        ORDER BY date ASC
    `, [req.userId, lookbackDays])

    res.json(fillDailyGaps(rows, numberOfDays))
})

// Remplit les jours absents de la réponse avec 0 pour garder un axe temporel continu.
function fillDailyGaps(rows, numberOfDays) {
    const counts = new Map(rows.map(row => [String(row.date).slice(0, 10), Number(row.count) || 0]))
    const result = []
    const today = new Date()
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate() - numberOfDays + 1)
    for (let index = 0; index < numberOfDays; index += 1) {
        const year = current.getFullYear()
        const month = String(current.getMonth() + 1).padStart(2, "0")
        const day = String(current.getDate()).padStart(2, "0")
        const date = `${year}-${month}-${day}`
        result.push({ date, count: counts.get(date) ?? 0 })
        current.setDate(current.getDate() + 1)
    }
    return result
}

// GET XP par semaine/mois
router.get("/xp-over-time", async (req, res) => {
    try {
        const { period } = req.query

        let groupBy, interval
        if (period === "year") {
            groupBy = "DATE_FORMAT(t.date, '%Y-%m')"
            interval = "11 MONTH"
        } else if (period === "month") {
            // FIX : '%Y-%m-%d' et non '%Y-%u' (qui groupait par semaine)
            groupBy = "DATE_FORMAT(t.date, '%Y-%m-%d')"
            interval = "1 MONTH"
        } else {
            groupBy = "DATE_FORMAT(t.date, '%Y-%m-%d')"
            interval = "7 DAY"
        }

        // FIX : on agrège TOUTES les sources d'XP avec UNION ALL
        // Source 1 : flow_sessions (xp_gained direct)
        // Source 2 : task_completions (10 XP fixe par complétion)
        // Source 3 : habit_logs success (XP selon difficulté de l'habitude)
        const [rows] = await db.execute(`
            SELECT
                ${groupBy} AS period,
                SUM(t.xp) AS xp
            FROM (

                -- Flow sessions
                SELECT
                    DATE(created_at) AS date,
                    xp_gained        AS xp
                FROM flow_sessions
                WHERE user_id = ?
                  AND completed = TRUE
                  AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})

                UNION ALL

                -- Task completions
                SELECT
                    DATE(completed_at) AS date,
                    10                 AS xp
                FROM task_completions
                WHERE user_id = ?
                  AND completed_at >= DATE_SUB(NOW(), INTERVAL ${interval})

                UNION ALL

                -- Habit logs (success uniquement, XP selon difficulté)
                SELECT
                    DATE(hl.logged_at) AS date,
                    CASE h.difficulty
                        WHEN 'easy'    THEN 5
                        WHEN 'medium'  THEN 15
                        WHEN 'hard'    THEN 30
                        WHEN 'extreme' THEN 50
                        ELSE 15
                    END AS xp
                FROM habit_logs hl
                JOIN habits h ON h.id = hl.habit_id
                WHERE hl.user_id = ?
                  AND hl.type = 'success'
                  AND hl.logged_at >= DATE_SUB(NOW(), INTERVAL ${interval})

            ) t
            GROUP BY ${groupBy}
            ORDER BY period ASC
        `, [req.userId, req.userId, req.userId])

        // Remplir les jours sans XP avec 0 pour que le graphique soit continu
        const filled = fillGaps(rows, period)
        res.json(filled)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching XP over time" })
    }
})

// Remplit les trous dans la série temporelle avec des 0
// Sans ça, Recharts relie les points existants en sautant les jours vides
function fillGaps(rows, period) {
    if (rows.length === 0) return []
    const map = {}
    rows.forEach(r => { map[r.period] = Number(r.xp) })
    const result = []
    const now = new Date()
    let start, fmt
    if (period === "year") {
        start = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const cur = new Date(start)
        while (cur <= now) {
            const key = fmt(cur)
            result.push({ period: key, xp: map[key] ?? 0 })
            cur.setMonth(cur.getMonth() + 1)
        }
    } else {
        const days = period === "month" ? 29 : 6
        start = new Date(now)
        start.setDate(now.getDate() - days)
        fmt = d => d.toISOString().split("T")[0]
        const cur = new Date(start)
        while (cur <= now) {
            const key = fmt(cur)
            result.push({ period: key, xp: map[key] ?? 0 })
            cur.setDate(cur.getDate() + 1)
        }
    }
    return result
}// GET radar par thème
router.get("/radar", async (req, res) => {
    const [themes] = await db.execute(
        "SELECT * FROM themes WHERE user_id = ?",
        [req.userId]
    )

    const radarData = await Promise.all(themes.map(async theme => {

        // Tâches via task_themes
        const [[{ taskCount }]] = await db.execute(`
            SELECT COUNT(*) as taskCount
            FROM tasks t
                     JOIN task_themes tt ON tt.task_id = t.id
            WHERE t.user_id = ? AND tt.theme_id = ?
        `, [req.userId, theme.id])

        const [[{ completedCount }]] = await db.execute(`
            SELECT COUNT(*) as completedCount
            FROM task_completions tc
            JOIN tasks t ON t.id = tc.task_id
            JOIN task_themes tt ON tt.task_id = t.id
            WHERE tc.user_id = ? AND tt.theme_id = ?
        `, [req.userId, theme.id])

        // Habitudes via habit_themes
        const [[{ habitCount }]] = await db.execute(`
            SELECT COUNT(*) as habitCount
            FROM habits h
                     JOIN habit_themes ht ON ht.habit_id = h.id
            WHERE h.user_id = ? AND ht.theme_id = ? AND h.is_active = TRUE
        `, [req.userId, theme.id])

        const [[{ habitSuccessCount }]] = await db.execute(`
            SELECT COUNT(DISTINCT DATE(hl.logged_at)) as habitSuccessCount
            FROM habit_logs hl
            JOIN habits h ON h.id = hl.habit_id
            JOIN habit_themes ht ON ht.habit_id = h.id
            WHERE hl.user_id = ? AND ht.theme_id = ? AND hl.type = 'success'
        `, [req.userId, theme.id])

        return {
            theme: theme.name,
            color: theme.color,
            emoji: theme.emoji,
            tasks: taskCount + habitCount,          // total activités
            completed: completedCount + habitSuccessCount,  // total complétions
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
    const numberOfDays = period === "year" ? 365 : period === "month" ? 30 : 7
    const lookbackDays = numberOfDays - 1

    const [rows] = await db.execute(`
        SELECT
            DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
            SUM(duration_minutes) AS minutes
        FROM flow_sessions
        WHERE user_id = ? AND type = 'focus' AND completed = TRUE
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
        ORDER BY date ASC
    `, [req.userId, lookbackDays])

    res.json(fillDailyGaps(rows, numberOfDays).map(row => ({ date: row.date, minutes: Number(row.count) || 0 })))
})

// GET heatmap : toute l'historique pour que le filtre « Tout » soit exact
router.get("/heatmap", async (req, res) => {
    const [rows] = await db.execute(`
        SELECT
            DATE_FORMAT(completed_at, '%Y-%m-%d') AS date,
            COUNT(*) AS count
        FROM task_completions
        WHERE user_id = ?
        GROUP BY DATE_FORMAT(completed_at, '%Y-%m-%d')
        ORDER BY date ASC
    `, [req.userId])

    res.json(rows.map(row => ({ ...row, count: Number(row.count) || 0 })))
})

module.exports = router