const db = require("../config/db")

async function updateAchievements(userId) {
    const [[{ tasks }]] = await db.execute(
        "SELECT COUNT(*) as tasks FROM task_completions WHERE user_id = ?",
        [userId]
    )

    const [[{ xp }]] = await db.execute(
        "SELECT xp FROM users WHERE id = ?",
        [userId]
    )

    const [achievements] = await db.execute("SELECT * FROM achievements")

    for (const a of achievements) {
        let progress = 0

        if (a.type === "tasks") progress = tasks
        if (a.type === "xp") progress = xp

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