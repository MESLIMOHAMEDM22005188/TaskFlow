const express = require("express")
const db = require("../config/db")

const router = express.Router()

// =======================
// GET FEED (intelligent)
// =======================
router.get("/posts", async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT 
                p.id, p.content, p.type, p.likes_count, p.created_at,
                u.username, u.avatar_url, u.xp,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as liked_by_me
            FROM posts p
            JOIN users u ON u.id = p.user_id
            ORDER BY 
                (p.likes_count * 3 + 
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) * 5) DESC,
                p.created_at DESC
            LIMIT 50
        `, [req.userId])

        res.json(posts)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching posts" })
    }
})

// =======================
// CREATE POST
// =======================
router.post("/posts", async (req, res) => {
    try {
        const { content, type, ref_id } = req.body

        if (!content?.trim()) {
            return res.status(400).json({ message: "Content required" })
        }

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

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error creating post" })
    }
})

// =======================
// DELETE POST
// =======================
router.delete("/posts/:id", async (req, res) => {
    try {
        await db.execute(
            "DELETE FROM posts WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        res.json({ message: "Post deleted" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error deleting post" })
    }
})

// =======================
// LIKE / UNLIKE (clean)
// =======================
router.post("/posts/:id/like", async (req, res) => {
    try {
        const postId = req.params.id

        const [existing] = await db.execute(
            "SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?",
            [postId, req.userId]
        )

        if (existing.length) {
            // UNLIKE
            await db.execute(
                "DELETE FROM post_likes WHERE post_id = ? AND user_id = ?",
                [postId, req.userId]
            )

            await db.execute(
                "UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?",
                [postId]
            )

            return res.json({ liked: false })
        }

        // LIKE
        await db.execute(
            "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)",
            [postId, req.userId]
        )

        await db.execute(
            "UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?",
            [postId]
        )

        res.json({ liked: true })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error liking post" })
    }
})

// =======================
// GET COMMENTS
// =======================
router.get("/posts/:id/comments", async (req, res) => {
    try {
        const [comments] = await db.execute(`
            SELECT c.*, u.username, u.avatar_url
            FROM comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [req.params.id])

        res.json(comments)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching comments" })
    }
})

// =======================
// CREATE COMMENT
// =======================
router.post("/posts/:id/comments", async (req, res) => {
    try {
        const { content } = req.body

        if (!content?.trim()) {
            return res.status(400).json({ message: "Content required" })
        }

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

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error creating comment" })
    }
})

// =======================
// COMPLETE TASK (core)
// =======================
router.post("/tasks/:id/complete", async (req, res) => {
    try {
        const taskId = req.params.id

        // éviter double completion (même jour)
        const [existing] = await db.execute(
            `SELECT 1 FROM task_completions 
             WHERE task_id = ? AND user_id = ? 
             AND DATE(completed_at) = CURDATE()`,
            [taskId, req.userId]
        )

        if (existing.length) {
            return res.status(400).json({ message: "Already completed today" })
        }

        // 1. save completion
        await db.execute(
            "INSERT INTO task_completions (task_id, user_id, completed_at) VALUES (?, ?, NOW())",
            [taskId, req.userId]
        )

        // 2. récupérer task
        const [[task]] = await db.execute(
            "SELECT title FROM tasks WHERE id = ?",
            [taskId]
        )

        // 3. XP
        await db.execute(
            "UPDATE users SET xp = xp + 10 WHERE id = ?",
            [req.userId]
        )

        // 4. post auto
        await db.execute(
            "INSERT INTO posts (user_id, content, type, ref_id) VALUES (?, ?, ?, ?)",
            [
                req.userId,
                `J’ai terminé "${task.title}" 🔥`,
                "task_completed",
                taskId
            ]
        )

        res.json({ message: "Task completed", xp: 10 })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error completing task" })
    }
})

// =======================
// LEADERBOARD (amélioré)
// =======================
router.get("/leaderboard", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                u.id, u.username, u.avatar_url, u.xp,
                COUNT(DISTINCT tc.id) as tasks_this_week
            FROM users u
            LEFT JOIN task_completions tc 
                ON tc.user_id = u.id 
                AND tc.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY u.id
            ORDER BY (u.xp * 0.7 + COUNT(DISTINCT tc.id) * 10) DESC
            LIMIT 10
        `)

        res.json(rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching leaderboard" })
    }
})

module.exports = router