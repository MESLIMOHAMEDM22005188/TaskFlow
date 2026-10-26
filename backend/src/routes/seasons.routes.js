const express = require("express")
const db = require("../config/db")

const router = express.Router()
const DAILY_GOAL_LIMIT = 10
const ENTRY_XP = 50

const PRESET_GOALS = [
    "Lire 10 pages", "Faire 20 minutes de mouvement", "Boire suffisamment d’eau",
    "Réviser ou apprendre 20 minutes", "Ranger pendant 10 minutes",
    "Avancer sur un projet personnel", "Écrire dans un journal",
    "Faire une pause sans écran", "Prendre soin de soi", "Préparer le lendemain",
]

async function ensureTables() {
    await db.execute(\`
        CREATE TABLE IF NOT EXISTS season_participation (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            season_key VARCHAR(12) NOT NULL,
            season_year INT NOT NULL,
            joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            badge_unlocked TINYINT(1) NOT NULL DEFAULT 1,
            bonus_xp INT NOT NULL DEFAULT 50,
            UNIQUE KEY uniq_season_participation (user_id, season_key, season_year),
            KEY idx_season_period (season_key, season_year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    \`)
    await db.execute(\`
        CREATE TABLE IF NOT EXISTS season_goals (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            user_id BIGINT NOT NULL,
            season_key VARCHAR(12) NOT NULL,
            season_year INT NOT NULL,
            title VARCHAR(120) NOT NULL,
            position_num TINYINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_season_goal_position (user_id, season_key, season_year, position_num),
            KEY idx_season_goals_user (user_id, season_key, season_year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    \`)
    await db.execute(\`
        CREATE TABLE IF NOT EXISTS season_goal_logs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            goal_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT NOT NULL,
            completed_date DATE NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_goal_daily (goal_id, completed_date),
            KEY idx_goal_logs_user_date (user_id, completed_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    \`)
}

function getSeasonRange(season, year) {
    const normalized = String(season || "").toLowerCase()
    const startYear = Number(year)
    if (!Number.isInteger(startYear) || startYear < 2020 || startYear > 2100) {
        const error = new Error("Année de saison invalide.")
        error.status = 400
        throw error
    }
    if (normalized === "winter") {
        return { key: normalized, label: "Winter Arc", start: \`\${startYear}-11-01 00:00:00\`, end: \`\${startYear + 1}-02-01 00:00:00\`, opensAt: \`\${startYear}-11-01T00:00:00\`, closesAt: \`\${startYear + 1}-02-01T00:00:00\` }
    }
    if (normalized === "summer") {
        return { key: normalized, label: "Summer Arc", start: \`\${startYear}-06-01 00:00:00\`, end: \`\${startYear}-09-01 00:00:00\`, opensAt: \`\${startYear}-06-01T00:00:00\`, closesAt: \`\${startYear}-09-01T00:00:00\` }
    }
    const error = new Error("Saison inconnue.")
    error.status = 400
    throw error
}

function getSeasonState(range) {
    const now = new Date()
    const start = new Date(range.opensAt)
    const end = new Date(range.closesAt)
    return { isOpen: now >= start && now < end, isFuture: now < start, isPast: now >= end, now }
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

function todaySqlDate() {
    const now = new Date()
    return \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}-\${String(now.getDate()).padStart(2, "0")}\`
}

async function getGoals(userId, season, year) {
    const today = todaySqlDate()
    const [rows] = await db.execute(\`
        SELECT g.id, g.title, g.position_num AS position,
               IF(l.id IS NULL, 0, 1) AS completedToday
        FROM season_goals g
        LEFT JOIN season_goal_logs l
          ON l.goal_id = g.id AND l.user_id = g.user_id AND l.completed_date = ?
        WHERE g.user_id = ? AND g.season_key = ? AND g.season_year = ?
        ORDER BY g.position_num ASC
    \`, [today, userId, season, year])
    return rows.map(row => ({ id: Number(row.id), title: row.title, position: Number(row.position), completedToday: Boolean(row.completedToday) }))
}

async function requireActiveParticipation(req, res, next) {
    try {
        const range = getSeasonRange(req.params.season, req.params.year)
        const state = getSeasonState(range)
        if (!state.isOpen) return res.status(423).json({ message: "Cet Arc est verrouillé jusqu’à sa saison.", isOpen: false, opensAt: range.opensAt, closesAt: range.closesAt })
        await ensureTables()
        const [[entry]] = await db.execute(
            "SELECT id FROM season_participation WHERE user_id = ? AND season_key = ? AND season_year = ?",
            [req.userId, range.key, Number(req.params.year)]
        )
        if (!entry) return res.status(403).json({ message: "Entre dans l’Arc pour débloquer son badge et ses objectifs.", needsJoin: true })
        req.seasonRange = range
        next()
    } catch (err) {
        if (err.status === 400) return res.status(400).json({ message: err.message })
        console.error("[Grindly:Seasons]", err)
        res.status(500).json({ message: "Impossible de charger les objectifs saisonniers." })
    }
}

router.get("/:season/:year", async (req, res) => {
    try {
        await ensureTables()
        const range = getSeasonRange(req.params.season, req.params.year)
        const state = getSeasonState(range)
        const year = Number(req.params.year)
        const [[participation]] = await db.execute(
            "SELECT id, joined_at, badge_unlocked, bonus_xp FROM season_participation WHERE user_id = ? AND season_key = ? AND season_year = ?",
            [req.userId, range.key, year]
        )

        if (!state.isOpen) {
            return res.json({
                season: range.label, seasonKey: range.key, year, startsAt: range.start, endsAt: range.end,
                opensAt: range.opensAt, closesAt: range.closesAt, isOpen: false,
                isFuture: state.isFuture, isPast: state.isPast, joined: Boolean(participation),
                badgeUnlocked: Boolean(participation && participation.badge_unlocked),
                entryXp: participation ? Number(participation.bonus_xp) : ENTRY_XP,
                leaderboard: [], me: null, goals: [], presets: PRESET_GOALS, today: todaySqlDate(),
            })
        }

        const goals = participation ? await getGoals(req.userId, range.key, year) : []
        const [rows] = await db.execute(\`
            SELECT u.id AS user_id, u.username, u.avatar_url,
                COALESCE(SUM(activity.xp), 0) AS season_xp,
                COUNT(activity.activity_date) AS actions_count,
                COUNT(DISTINCT activity.activity_date) AS active_days
            FROM users u
            LEFT JOIN (
                SELECT user_id, DATE(completed_at) AS activity_date, 10 AS xp
                FROM task_completions WHERE completed_at >= ? AND completed_at < ?
                UNION ALL
                SELECT user_id, DATE(created_at) AS activity_date, xp_gained AS xp
                FROM flow_sessions WHERE completed = TRUE AND created_at >= ? AND created_at < ?
                UNION ALL
                SELECT hl.user_id, DATE(hl.logged_at) AS activity_date,
                    CASE h.difficulty WHEN 'easy' THEN 5 WHEN 'medium' THEN 15 WHEN 'hard' THEN 30 WHEN 'extreme' THEN 50 ELSE 15 END AS xp
                FROM habit_logs hl JOIN habits h ON h.id = hl.habit_id
                WHERE hl.type = 'success' AND hl.logged_at >= ? AND hl.logged_at < ?
                UNION ALL
                SELECT user_id, DATE(joined_at) AS activity_date, bonus_xp AS xp
                FROM season_participation WHERE season_key = ? AND season_year = ?
            ) activity ON activity.user_id = u.id
            WHERE COALESCE(u.privacy_appear_leaderboard, 1) = 1
            GROUP BY u.id, u.username, u.avatar_url
            HAVING season_xp > 0 OR u.id = ?
            ORDER BY season_xp DESC, active_days DESC, u.username ASC
            LIMIT 100
        \`, [range.start, range.end, range.start, range.end, range.start, range.end, range.key, year, req.userId])

        const leaderboard = rows.map((row, index) => ({
            rank: index + 1, userId: Number(row.user_id), username: row.username, avatarUrl: row.avatar_url || null,
            xp: Number(row.season_xp) || 0, actions: Number(row.actions_count) || 0,
            activeDays: Number(row.active_days) || 0, division: rankForXp(row.season_xp),
            isMe: Number(row.user_id) === Number(req.userId),
        }))
        const me = leaderboard.find(entry => entry.isMe) || null
        res.json({
            season: range.label, seasonKey: range.key, year, startsAt: range.start, endsAt: range.end,
            opensAt: range.opensAt, closesAt: range.closesAt, isOpen: true, isFuture: false, isPast: false,
            joined: Boolean(participation), badgeUnlocked: Boolean(participation && participation.badge_unlocked),
            entryXp: participation ? Number(participation.bonus_xp) : ENTRY_XP,
            leaderboard, me, goals, presets: PRESET_GOALS, today: todaySqlDate(),
        })
    } catch (err) {
        if (err.status === 400) return res.status(400).json({ message: err.message })
        console.error("[Grindly:Seasons]", err)
        res.status(500).json({ message: "Impossible de charger cette saison." })
    }
})

router.post("/:season/:year/join", async (req, res) => {
    try {
        await ensureTables()
        const range = getSeasonRange(req.params.season, req.params.year)
        const state = getSeasonState(range)
        if (!state.isOpen) return res.status(423).json({ message: "Cet Arc est verrouillé jusqu’à sa saison.", isOpen: false, opensAt: range.opensAt })
        const [result] = await db.execute(
            "INSERT IGNORE INTO season_participation (user_id, season_key, season_year, bonus_xp, badge_unlocked) VALUES (?, ?, ?, ?, 1)",
            [req.userId, range.key, Number(req.params.year), ENTRY_XP]
        )
        if (result.affectedRows > 0) {
            await db.execute("UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE id = ?", [ENTRY_XP, req.userId])
        }
        const [[participation]] = await db.execute(
            "SELECT badge_unlocked, bonus_xp FROM season_participation WHERE user_id = ? AND season_key = ? AND season_year = ?",
            [req.userId, range.key, Number(req.params.year)]
        )
        res.json({ joined: true, newlyJoined: result.affectedRows > 0, badgeUnlocked: Boolean(participation.badge_unlocked), entryXp: Number(participation.bonus_xp), message: result.affectedRows > 0 ? "Badge saisonnier débloqué : +50 XP !" : "Tu as déjà rejoint cet Arc." })
    } catch (err) {
        if (err.status === 400) return res.status(400).json({ message: err.message })
        console.error("[Grindly:Seasons]", err)
        res.status(500).json({ message: "Impossible de rejoindre cet Arc." })
    }
})

router.put("/:season/:year/goals", requireActiveParticipation, async (req, res) => {
    try {
        const rawGoals = Array.isArray(req.body.goals) ? req.body.goals : []
        if (rawGoals.length !== DAILY_GOAL_LIMIT) return res.status(400).json({ message: "Choisis ou écris exactement 10 objectifs." })
        const titles = rawGoals.map(value => String(value || "").trim())
        if (titles.some(title => !title || title.length > 120)) return res.status(400).json({ message: "Chaque objectif doit contenir entre 1 et 120 caractères." })
        if (new Set(titles.map(title => title.toLocaleLowerCase())).size !== titles.length) return res.status(400).json({ message: "Tes 10 objectifs doivent être différents." })
        const range = req.seasonRange
        const year = Number(req.params.year)
        const connection = await db.getConnection()
        try {
            await connection.beginTransaction()
            await connection.execute("DELETE FROM season_goals WHERE user_id = ? AND season_key = ? AND season_year = ?", [req.userId, range.key, year])
            for (let i = 0; i < titles.length; i++) {
                await connection.execute(
                    "INSERT INTO season_goals (user_id, season_key, season_year, title, position_num) VALUES (?, ?, ?, ?, ?)",
                    [req.userId, range.key, year, titles[i], i + 1]
                )
            }
            await connection.commit()
        } catch (err) {
            await connection.rollback()
            throw err
        } finally {
            connection.release()
        }
        res.json({ goals: await getGoals(req.userId, range.key, year), message: "Tes 10 objectifs sont enregistrés." })
    } catch (err) {
        console.error("[Grindly:Seasons:goals]", err)
        res.status(500).json({ message: err.status === 400 ? err.message : "Impossible d’enregistrer tes objectifs." })
    }
})

router.post("/:season/:year/goals/:goalId/toggle", requireActiveParticipation, async (req, res) => {
    try {
        const goalId = Number(req.params.goalId)
        if (!Number.isInteger(goalId) || goalId <= 0) return res.status(400).json({ message: "Objectif invalide." })
        const [goals] = await db.execute(
            "SELECT id FROM season_goals WHERE id = ? AND user_id = ? AND season_key = ? AND season_year = ?",
            [goalId, req.userId, req.seasonRange.key, Number(req.params.year)]
        )
        if (!goals.length) return res.status(404).json({ message: "Objectif introuvable." })
        const today = todaySqlDate()
        const [existing] = await db.execute("SELECT id FROM season_goal_logs WHERE goal_id = ? AND completed_date = ?", [goalId, today])
        if (existing.length) {
            await db.execute("DELETE FROM season_goal_logs WHERE goal_id = ? AND user_id = ? AND completed_date = ?", [goalId, req.userId, today])
        } else {
            await db.execute("INSERT IGNORE INTO season_goal_logs (goal_id, user_id, completed_date) VALUES (?, ?, ?)", [goalId, req.userId, today])
        }
        res.json({ goals: await getGoals(req.userId, req.seasonRange.key, Number(req.params.year)), today })
    } catch (err) {
        console.error("[Grindly:Seasons:toggle]", err)
        res.status(500).json({ message: "Impossible de mettre à jour cet objectif." })
    }
})

module.exports = router
