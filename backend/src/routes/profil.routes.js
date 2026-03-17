const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {

    const [user] = await db.execute(
        "SELECT id, email, username, bio, avatar_url, xp, top3_count FROM users WHERE id = ?",
        [req.userId]
    )

    if (user.length === 0) return res.status(404).json({ message: "User not found" })

    const [[{ tasksCompleted }]] = await db.execute(
        "SELECT COUNT(*) as tasksCompleted FROM task_completions WHERE user_id = ?",
        [req.userId]
    )

    const [[{ themesCreated }]] = await db.execute(
        "SELECT COUNT(*) as themesCreated FROM themes WHERE user_id = ?",
        [req.userId]
    )

    const [[{ communityPosts }]] = await db.execute(
        "SELECT COUNT(*) as communityPosts FROM posts WHERE user_id = ?",
        [req.userId]
    )

    const [[{ activityDays }]] = await db.execute(
        "SELECT COUNT(DISTINCT completed_at) as activityDays FROM task_completions WHERE user_id = ?",
        [req.userId]
    )

    const [streakRows] = await db.execute(`
        SELECT COUNT(*) as streak
        FROM (
                 SELECT completed_at,
                        DATE_SUB(completed_at, INTERVAL ROW_NUMBER() OVER (ORDER BY completed_at) DAY) as grp
                 FROM (SELECT DISTINCT completed_at FROM task_completions WHERE user_id = ?) t
             ) grouped
        GROUP BY grp
        ORDER BY MAX(completed_at) DESC
            LIMIT 1
    `, [req.userId])

    const streak = streakRows.length > 0 ? streakRows[0].streak : 0

    const [achievements] = await db.execute(`
        SELECT 
            a.id, a.name, a.description, a.goal, a.level, a.type,
            COALESCE(ua.progress, 0) as progress,
            COALESCE(ua.completed, FALSE) as completed
        FROM achievements a
        LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
        ORDER BY a.level ASC
    `, [req.userId])

    const xp = user[0].xp ?? 0

    const divisions = [
        { name: "Fer",          min: 0 },
        { name: "Bronze",       min: 500 },
        { name: "Argent",       min: 1500 },
        { name: "Or",           min: 3000 },
        { name: "Platine",      min: 6000 },
        { name: "Émeraude",     min: 10000 },
        { name: "Diamant",      min: 15000 },
        { name: "Maître",       min: 22000 },
        { name: "Grand Maître", min: 30000 },
        { name: "Challenger",   min: 40000 },
    ]

    const divisionName = [...divisions].reverse().find(d => xp >= d.min)?.name ?? "Fer"
    const currentDiv = divisions.find(d => d.name === divisionName)
    const nextDiv = divisions[divisions.indexOf(currentDiv) + 1]
    const divRange = nextDiv ? nextDiv.min - currentDiv.min : 10000
    const progress = (xp - currentDiv.min) / divRange

    let tier = "I"
    if (progress >= 0.75) tier = "IV"
    else if (progress >= 0.50) tier = "III"
    else if (progress >= 0.25) tier = "II"
    const noTierDivisions = ["Maître", "Grand Maître", "Challenger"]
    const division = noTierDivisions.includes(divisionName) ? divisionName : `${divisionName} ${tier}`

    res.json({
        ...user[0],
        stats: {
            tasksCompleted,
            themesCreated,
            communityPosts,
            activityDays,
            xp,
            division,
            top3Count: user[0].top3_count ?? 0,
            streak: streak ?? 0
        },
        achievements
    })
})

router.put("/", async (req, res) => {
    const { username, bio } = req.body
    await db.execute(
        "UPDATE users SET username = ?, bio = ? WHERE id = ?",
        [username || null, bio || null, req.userId]
    )
    const [rows] = await db.execute(
        "SELECT id, email, username, bio, avatar_url FROM users WHERE id = ?",
        [req.userId]
    )
    res.json(rows[0])
})

module.exports = router