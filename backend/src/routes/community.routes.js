const express = require("express")
const db = require("../config/db")

const router = express.Router()

// GET feed
router.get("/posts", async (req, res) => {
    const [posts] = await db.execute(`
        SELECT 
            p.id, p.content, p.type, p.likes_count, p.created_at,
            u.username, u.avatar_url, u.xp,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as liked_by_me
        FROM posts p
        JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
        LIMIT 50
    `, [req.userId])
    res.json(posts)
})

// POST créer un post
router.post("/posts", async (req, res) => {
    const { content, type, ref_id } = req.body

    if (!content?.trim()) return res.status(400).json({ message: "Content required" })

    const [result] = await db.execute(
        "INSERT INTO posts (user_id, content, type, ref_id) VALUES (?, ?, ?, ?)",
        [req.userId, content, type || "free", ref_id || null]
    )

    const [rows] = await db.execute(`
        SELECT p.*, u.username, u.avatar_url, u.xp
        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
    `, [result.insertId])

    res.json(rows[0])
})

// DELETE supprimer un post
router.delete("/posts/:id", async (req, res) => {
    await db.execute(
        "DELETE FROM posts WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )
    res.json({ message: "Post deleted" })
})

// POST liker un post
router.post("/posts/:id/like", async (req, res) => {
    try {
        await db.execute(
            "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)",
            [req.params.id, req.userId]
        )
        await db.execute(
            "UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?",
            [req.params.id]
        )
        res.json({ liked: true })
    } catch {
        // already liked — unlike
        await db.execute(
            "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )
        await db.execute(
            "UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?",
            [req.params.id]
        )
        res.json({ liked: false })
    }
})

// GET commentaires d'un post
router.get("/posts/:id/comments", async (req, res) => {
    const [comments] = await db.execute(`
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
    `, [req.params.id])
    res.json(comments)
})

// POST ajouter un commentaire
router.post("/posts/:id/comments", async (req, res) => {
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: "Content required" })

    const [result] = await db.execute(
        "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
        [req.params.id, req.userId, content]
    )

    const [rows] = await db.execute(`
        SELECT c.*, u.username, u.avatar_url
        FROM comments c
        JOIN users u ON u.id = c.user_id
        WHERE c.id = ?
    `, [result.insertId])

    res.json(rows[0])
})

// GET leaderboard
router.get("/leaderboard", async (req, res) => {
    const [rows] = await db.execute(`
        SELECT 
            u.id, u.username, u.avatar_url, u.xp,
            COUNT(DISTINCT tc.id) as tasks_this_week
        FROM users u
        LEFT JOIN task_completions tc ON tc.user_id = u.id 
            AND tc.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY u.id
        ORDER BY u.xp DESC
        LIMIT 10
    `)
    res.json(rows)
})

module.exports = router