const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    const [user] = await db.execute(
        "SELECT id, email, username, bio, avatar_url FROM users WHERE id = ?",
        [req.userId]
    )

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

    if (user.length === 0) return res.status(404).json({ message: "User not found" })

    res.json({
        ...user[0],
        stats: {
            tasksCompleted,
            themesCreated,
            communityPosts
        }
    })
})
// PUT mettre à jour le profil
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