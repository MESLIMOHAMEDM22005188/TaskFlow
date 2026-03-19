const db = require("../config/db")

async function updateAchievements(userId) {

    // 1. récupérer les stats réelles
    const [[{ tasks }]] = await db.execute(
        "SELECT COUNT(*) as tasks FROM task_completions WHERE user_id = ?",
        [userId]
    )

    const [[{ themes }]] = await db.execute(
        "SELECT COUNT(*) as themes FROM themes WHERE user_id = ?",
        [userId]
    )

    const [[{ xp }]] = await db.execute(
        "SELECT xp FROM users WHERE id = ?",
        [userId]
    )

    const [[{ top3 }]] = await db.execute(
        "SELECT top3_count as top3 FROM users WHERE id = ?",
        [userId]
    )

    // 2. récupérer les achievements
    const [achievements] = await db.execute("SELECT * FROM achievements")

    // 3. associer chaque type à sa valeur
    const stats = {
        tasks,
        themes,
        xp,
        top3,
    }

    // 4. update chaque achievement
    for (const a of achievements) {

        const progress = stats[a.type] || 0
        const completed = progress >= a.goal

        await db.execute(`
            INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                progress = VALUES(progress),
                completed = VALUES(completed)
        `, [userId, a.id, progress, completed])
    }
}

module.exports = { updateAchievements }