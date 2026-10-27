const db = require("../config/db")

// Fifty seeded achievements with a stable slug. Seeding is idempotent and
// can be executed from the profile endpoint for existing production installs.
const BADGE_CATALOG = [
    ["first_step", "Premier pas", "Termine ta première tâche.", "tasks", 1, 1],
    ["five_done", "En mouvement", "Termine 5 tâches.", "tasks", 5, 1],
    ["ten_done", "Bien lancé", "Termine 10 tâches.", "tasks", 10, 1],
    ["twenty_five_done", "En progression", "Termine 25 tâches.", "tasks", 25, 2],
    ["fifty_done", "Régulier", "Termine 50 tâches.", "tasks", 50, 2],
    ["one_hundred_done", "Centurion", "Termine 100 tâches.", "tasks", 100, 3],
    ["two_hundred_done", "Machine à tâches", "Termine 200 tâches.", "tasks", 200, 3],
    ["five_hundred_done", "Force tranquille", "Termine 500 tâches.", "tasks", 500, 4],
    ["thousand_done", "Légende", "Termine 1 000 tâches.", "tasks", 1000, 5],
    ["five_themes", "Curieux", "Crée 5 thèmes.", "themes", 5, 1],
    ["ten_themes", "Organisateur", "Crée 10 thèmes.", "themes", 10, 2],
    ["twenty_themes", "Architecte de vie", "Crée 20 thèmes.", "themes", 20, 3],
    ["five_hundred_xp", "XP bronze", "Gagne 500 XP.", "xp", 500, 1],
    ["one_thousand_xp", "Réserve d'énergie", "Gagne 1 000 XP.", "xp", 1000, 1],
    ["three_thousand_xp", "Montée en puissance", "Gagne 3 000 XP.", "xp", 3000, 2],
    ["five_thousand_xp", "En feu", "Gagne 5 000 XP.", "xp", 5000, 2],
    ["ten_thousand_xp", "Puissance maximale", "Gagne 10 000 XP.", "xp", 10000, 3],
    ["twenty_thousand_xp", "Titan XP", "Gagne 20 000 XP.", "xp", 20000, 4],
    ["fifty_thousand_xp", "Mythe", "Gagne 50 000 XP.", "xp", 50000, 5],
    ["top3_once", "Sur le podium", "Atteins le top 3 une fois.", "top3", 1, 1],
    ["top3_five", "Concurrent", "Atteins le top 3 cinq fois.", "top3", 5, 2],
    ["top3_ten", "Médaillé", "Atteins le top 3 dix fois.", "top3", 10, 3],
    ["top3_twenty_five", "Champion", "Atteins le top 3 25 fois.", "top3", 25, 4],
    ["top3_fifty", "Hall of Fame", "Atteins le top 3 50 fois.", "top3", 50, 5],
    ["first_post", "Prends la parole", "Publie dans la communauté.", "posts", 1, 1],
    ["five_posts", "Voix active", "Publie 5 fois dans la communauté.", "posts", 5, 1],
    ["twenty_posts", "Pilier communautaire", "Publie 20 fois dans la communauté.", "posts", 20, 2],
    ["fifty_posts", "Créateur engagé", "Publie 50 fois dans la communauté.", "posts", 50, 3],
    ["hundred_posts", "Animateur", "Publie 100 fois dans la communauté.", "posts", 100, 4],
    ["three_activity_days", "Retour gagnant", "Sois actif 3 jours différents.", "activity_days", 3, 1],
    ["seven_activity_days", "Une semaine", "Sois actif 7 jours différents.", "activity_days", 7, 1],
    ["fourteen_activity_days", "Deux semaines", "Sois actif 14 jours différents.", "activity_days", 14, 2],
    ["thirty_activity_days", "Un mois de progrès", "Sois actif 30 jours différents.", "activity_days", 30, 2],
    ["sixty_activity_days", "Habitude installée", "Sois actif 60 jours différents.", "activity_days", 60, 3],
    ["hundred_activity_days", "Toujours présent", "Sois actif 100 jours différents.", "activity_days", 100, 4],
    ["three_hundred_activity_days", "Année de constance", "Sois actif 300 jours différents.", "activity_days", 300, 5],
    ["three_streak", "Série en cours", "Complète des tâches 3 jours de suite.", "streak", 3, 1],
    ["seven_streak", "Semaine parfaite", "Complète des tâches 7 jours de suite.", "streak", 7, 2],
    ["fourteen_streak", "Deux semaines solides", "Complète des tâches 14 jours de suite.", "streak", 14, 3],
    ["thirty_streak", "Inarrêtable", "Complète des tâches 30 jours de suite.", "streak", 30, 4],
    ["sixty_streak", "Discipline de fer", "Complète des tâches 60 jours de suite.", "streak", 60, 5],
    ["hundred_streak", "Ligne légendaire", "Complète des tâches 100 jours de suite.", "streak", 100, 5],
    ["first_off_schedule", "Surprise productive", "Termine une tâche hors planning.", "off_schedule", 1, 1],
    ["five_off_schedule", "Plan B efficace", "Termine 5 tâches hors planning.", "off_schedule", 5, 2],
    ["twenty_off_schedule", "Flexible et efficace", "Termine 20 tâches hors planning.", "off_schedule", 20, 3],
    ["fifty_off_schedule", "Improvisation maîtrisée", "Termine 50 tâches hors planning.", "off_schedule", 50, 4],
    ["hundred_off_schedule", "Maître de l'adaptation", "Termine 100 tâches hors planning.", "off_schedule", 100, 5],
    ["first_focus", "Dans sa bulle", "Termine une session de concentration.", "focus_sessions", 1, 1],
    ["ten_focus", "Concentration solide", "Termine 10 sessions de concentration.", "focus_sessions", 10, 2],
    ["fifty_focus", "Flow state", "Termine 50 sessions de concentration.", "focus_sessions", 50, 3],
]

let badgeCatalogPromise = null

async function ensureBadgeCatalog() {
    // Avoid running 50 INSERT checks on every profile request. The Promise is
    // shared between concurrent requests in the current server process.
    if (!badgeCatalogPromise) {
        badgeCatalogPromise = (async () => {
            for (const [slug, name, description, type, goal, level] of BADGE_CATALOG) {
                await db.execute(`
                    INSERT INTO achievements (name, description, type, goal, level)
                    SELECT ?, ?, ?, ?, ?
                    WHERE NOT EXISTS (
                        SELECT 1 FROM achievements WHERE name = ? AND type = ? AND goal = ?
                    )
                `, [name, description, type, goal, level, name, type, goal])
            }
        })().catch(error => {
            badgeCatalogPromise = null
            throw error
        })
    }
    await badgeCatalogPromise
}

async function calculateStats(userId) {
    const [[{ tasks }]] = await db.execute(
        "SELECT COUNT(*) AS tasks FROM task_completions WHERE user_id = ?",
        [userId]
    )
    const [[{ themes }]] = await db.execute(
        "SELECT COUNT(*) AS themes FROM themes WHERE user_id = ?",
        [userId]
    )
    const [[{ xp }]] = await db.execute(
        "SELECT COALESCE(xp, 0) AS xp FROM users WHERE id = ?",
        [userId]
    )
    const [[{ top3 }]] = await db.execute(
        "SELECT COALESCE(top3_count, 0) AS top3 FROM users WHERE id = ?",
        [userId]
    )
    const [[{ posts }]] = await db.execute(
        "SELECT COUNT(*) AS posts FROM posts WHERE user_id = ?",
        [userId]
    )
    const [[{ activity_days }]] = await db.execute(
        "SELECT COUNT(DISTINCT DATE(completed_at)) AS activity_days FROM task_completions WHERE user_id = ?",
        [userId]
    )
    const [streakRows] = await db.execute(`
        SELECT COUNT(*) AS streak
        FROM (
            SELECT d, DATE_SUB(d, INTERVAL ROW_NUMBER() OVER (ORDER BY d) DAY) AS grp
            FROM (
                SELECT DISTINCT DATE(completed_at) AS d
                FROM task_completions WHERE user_id = ?
            ) days
        ) streak_groups
        GROUP BY grp
        ORDER BY MAX(d) DESC
        LIMIT 1
    `, [userId])
    const [[{ focus_sessions }]] = await db.execute(
        "SELECT COUNT(*) AS focus_sessions FROM flow_sessions WHERE user_id = ? AND type = 'focus' AND completed = TRUE",
        [userId]
    )
    let off_schedule = 0
    try {
        const [[row]] = await db.execute(
            "SELECT COUNT(*) AS off_schedule FROM task_completions WHERE user_id = ? AND off_schedule = TRUE",
            [userId]
        )
        off_schedule = Number(row?.off_schedule || 0)
    } catch {
        // Off-schedule tracking is added lazily for older schemas below.
    }

    return {
        tasks: Number(tasks || 0),
        themes: Number(themes || 0),
        xp: Number(xp || 0),
        top3: Number(top3 || 0),
        posts: Number(posts || 0),
        activity_days: Number(activity_days || 0),
        streak: Number(streakRows[0]?.streak || 0),
        focus_sessions: Number(focus_sessions || 0),
        off_schedule,
    }
}

async function updateAchievements(userId) {
    await ensureBadgeCatalog()
    const stats = await calculateStats(userId)
    const [achievements] = await db.execute("SELECT * FROM achievements")

    for (const achievement of achievements) {
        const progress = Number(stats[achievement.type] || 0)
        const completed = progress >= Number(achievement.goal || 1)

        await db.execute(`
            INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                progress = GREATEST(progress, VALUES(progress)),
                completed = (completed OR VALUES(completed))
        `, [userId, achievement.id, progress, completed])
    }
}

module.exports = { updateAchievements, ensureBadgeCatalog, BADGE_CATALOG }
