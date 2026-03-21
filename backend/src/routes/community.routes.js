const express = require("express")
const db = require("../config/db")

const router = express.Router()

// ================================
// UTILS
// ================================

const ANON_ADJECTIVES = ["Courageux", "Discret", "Serein", "Déterminé", "Libre", "Calme", "Fort", "Sage", "Vif", "Zen"]
const ANON_ANIMALS = ["Renard", "Aigle", "Lynx", "Loup", "Ours", "Faucon", "Tigre", "Dauphin", "Corbeau", "Panthère"]

function generateAnonName() {
    const adj = ANON_ADJECTIVES[Math.floor(Math.random() * ANON_ADJECTIVES.length)]
    const animal = ANON_ANIMALS[Math.floor(Math.random() * ANON_ANIMALS.length)]
    const num = Math.floor(Math.random() * 99) + 1
    return `${adj}${animal}${num}`
}

// ================================
// POSTS — FEED GÉNÉRAL
// ================================

router.get("/posts", async (req, res) => {
    try {
        const { group_id } = req.query

        let whereClause = "WHERE p.group_id IS NULL AND p.is_anonymous = FALSE"
        const params = [req.userId]

        if (group_id) {
            // Feed d'un groupe spécifique (non anonyme)
            whereClause = "WHERE p.group_id = ?"
            params.unshift(req.userId)
            params.splice(1, 0, group_id)
        }

        const [posts] = await db.execute(`
            SELECT 
                p.id, p.content, p.type, p.likes_count, p.created_at,
                p.group_id, p.is_anonymous, p.anon_name,
                u.username, u.avatar_url, u.xp,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as liked_by_me
            FROM posts p
            JOIN users u ON u.id = p.user_id
            ${whereClause}
            ORDER BY 
                (p.likes_count * 3 + (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) * 5) DESC,
                p.created_at DESC
            LIMIT 50
        `, params)

        // Masquer l'identité pour les posts anonymes (même si c'est le sien)
        const sanitized = posts.map(p => ({
            ...p,
            username: p.is_anonymous ? p.anon_name : p.username,
            avatar_url: p.is_anonymous ? null : p.avatar_url,
            xp: p.is_anonymous ? 0 : p.xp,
        }))

        res.json(sanitized)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching posts" })
    }
})

// ================================
// POSTS — FEED ANONYME
// ================================

router.get("/posts/anonymous", async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT 
                p.id, p.content, p.type, p.likes_count, p.created_at,
                p.anon_name,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?) as liked_by_me
            FROM posts p
            WHERE p.is_anonymous = TRUE
            ORDER BY p.created_at DESC
            LIMIT 50
        `, [req.userId])

        // On n'expose JAMAIS username/avatar/xp réels ici
        const sanitized = posts.map(p => ({
            ...p,
            username: p.anon_name,
            avatar_url: null,
            xp: 0,
            is_anonymous: true,
        }))

        res.json(sanitized)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching anonymous posts" })
    }
})

// ================================
// CREATE POST (normal ou anonyme)
// ================================

router.post("/posts", async (req, res) => {
    try {
        const { content, type, ref_id, group_id, is_anonymous } = req.body

        if (!content?.trim()) return res.status(400).json({ message: "Content required" })

        // Vérifier membership si groupe
        if (group_id) {
            const [membership] = await db.execute(
                "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?",
                [group_id, req.userId]
            )
            if (!membership.length) return res.status(403).json({ message: "Not a member of this group" })
        }

        const anonName = is_anonymous ? generateAnonName() : null

        const [result] = await db.execute(
            `INSERT INTO posts (user_id, content, type, ref_id, group_id, is_anonymous, anon_name)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.userId, content, type || "free", ref_id || null, group_id || null, !!is_anonymous, anonName]
        )

        const [rows] = await db.execute(`
            SELECT p.*, u.username, u.avatar_url, u.xp
            FROM posts p JOIN users u ON u.id = p.user_id
            WHERE p.id = ?
        `, [result.insertId])

        const post = rows[0]
        res.json({
            ...post,
            username: is_anonymous ? anonName : post.username,
            avatar_url: is_anonymous ? null : post.avatar_url,
            xp: is_anonymous ? 0 : post.xp,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error creating post" })
    }
})

// ================================
// DELETE POST
// ================================

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

// ================================
// LIKE / UNLIKE
// ================================

router.post("/posts/:id/like", async (req, res) => {
    try {
        const postId = req.params.id
        const [existing] = await db.execute(
            "SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?",
            [postId, req.userId]
        )

        if (existing.length) {
            await db.execute("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, req.userId])
            await db.execute("UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?", [postId])
            return res.json({ liked: false })
        }

        await db.execute("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", [postId, req.userId])
        await db.execute("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?", [postId])
        res.json({ liked: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error liking post" })
    }
})

// ================================
// COMMENTS
// ================================

router.get("/posts/:id/comments", async (req, res) => {
    try {
        const [comments] = await db.execute(`
            SELECT c.*, u.username, u.avatar_url,
                   c.is_anonymous, c.anon_name
            FROM comments c
            JOIN users u ON u.id = c.user_id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [req.params.id])

        const sanitized = comments.map(c => ({
            ...c,
            username: c.is_anonymous ? c.anon_name : c.username,
            avatar_url: c.is_anonymous ? null : c.avatar_url,
        }))

        res.json(sanitized)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching comments" })
    }
})

router.post("/posts/:id/comments", async (req, res) => {
    try {
        const { content, is_anonymous } = req.body
        if (!content?.trim()) return res.status(400).json({ message: "Content required" })

        const anonName = is_anonymous ? generateAnonName() : null

        const [result] = await db.execute(
            "INSERT INTO comments (post_id, user_id, content, is_anonymous, anon_name) VALUES (?, ?, ?, ?, ?)",
            [req.params.id, req.userId, content, !!is_anonymous, anonName]
        )

        const [rows] = await db.execute(`
            SELECT c.*, u.username, u.avatar_url
            FROM comments c JOIN users u ON u.id = c.user_id
            WHERE c.id = ?
        `, [result.insertId])

        const c = rows[0]
        res.json({
            ...c,
            username: is_anonymous ? anonName : c.username,
            avatar_url: is_anonymous ? null : c.avatar_url,
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error creating comment" })
    }
})

// ================================
// GROUPES — CRUD
// ================================

// Lister tous les groupes (avec info membership)
router.get("/groups", async (req, res) => {
    try {
        const [groups] = await db.execute(`
            SELECT 
                g.*,
                COUNT(DISTINCT gm.user_id) as member_count,
                COUNT(DISTINCT p.id) as post_count,
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND user_id = ?) as is_member
            FROM groups g
            LEFT JOIN group_members gm ON gm.group_id = g.id
            LEFT JOIN posts p ON p.group_id = g.id
            GROUP BY g.id
            ORDER BY member_count DESC
        `, [req.userId])

        res.json(groups)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching groups" })
    }
})

// Créer un groupe
router.post("/groups", async (req, res) => {
    try {
        const { name, description, emoji, category, is_private } = req.body
        if (!name?.trim()) return res.status(400).json({ message: "Name required" })

        const [result] = await db.execute(
            `INSERT INTO groups (name, description, emoji, category, is_private, created_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description || null, emoji || "💬", category || "general", !!is_private, req.userId]
        )

        // Créateur = membre automatiquement + admin
        await db.execute(
            "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'admin')",
            [result.insertId, req.userId]
        )

        const [rows] = await db.execute("SELECT * FROM groups WHERE id = ?", [result.insertId])
        res.json({ ...rows[0], member_count: 1, post_count: 0, is_member: 1 })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error creating group" })
    }
})

// Rejoindre / quitter un groupe
router.post("/groups/:id/join", async (req, res) => {
    try {
        const groupId = req.params.id
        const [existing] = await db.execute(
            "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?",
            [groupId, req.userId]
        )

        if (existing.length) {
            // Quitter (sauf si admin et seul membre)
            await db.execute(
                "DELETE FROM group_members WHERE group_id = ? AND user_id = ?",
                [groupId, req.userId]
            )
            return res.json({ joined: false })
        }

        await db.execute(
            "INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, 'member')",
            [groupId, req.userId]
        )
        res.json({ joined: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error joining group" })
    }
})

// Membres d'un groupe
router.get("/groups/:id/members", async (req, res) => {
    try {
        const [members] = await db.execute(`
            SELECT u.id, u.username, u.avatar_url, u.xp, gm.role, gm.joined_at
            FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            WHERE gm.group_id = ?
            ORDER BY gm.role DESC, u.xp DESC
        `, [req.params.id])

        res.json(members)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching members" })
    }
})

// ================================
// LEADERBOARD
// ================================

router.get("/leaderboard", async (req, res) => {
    try {
        const { group_id } = req.query

        let joinClause = ""
        let whereClause = ""
        const params = []

        if (group_id) {
            joinClause = "JOIN group_members gm ON gm.user_id = u.id AND gm.group_id = ?"
            params.push(group_id)
        }

        const [rows] = await db.execute(`
            SELECT 
                u.id, u.username, u.avatar_url, u.xp,
                COUNT(DISTINCT tc.id) as tasks_this_week
            FROM users u
            ${joinClause}
            LEFT JOIN task_completions tc 
                ON tc.user_id = u.id 
                AND tc.completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY u.id
            ORDER BY (u.xp * 0.7 + COUNT(DISTINCT tc.id) * 10) DESC
            LIMIT 10
        `, params)

        res.json(rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching leaderboard" })
    }
})

// ================================
// COMPLETE TASK (auto-post)
// ================================

router.post("/tasks/:id/complete", async (req, res) => {
    try {
        const taskId = req.params.id

        const [existing] = await db.execute(
            `SELECT 1 FROM task_completions WHERE task_id = ? AND user_id = ? AND DATE(completed_at) = CURDATE()`,
            [taskId, req.userId]
        )
        if (existing.length) return res.status(400).json({ message: "Already completed today" })

        await db.execute(
            "INSERT INTO task_completions (task_id, user_id, completed_at) VALUES (?, ?, NOW())",
            [taskId, req.userId]
        )

        const [[task]] = await db.execute("SELECT title FROM tasks WHERE id = ?", [taskId])
        await db.execute("UPDATE users SET xp = xp + 10 WHERE id = ?", [req.userId])
        await db.execute(
            "INSERT INTO posts (user_id, content, type, ref_id, is_anonymous) VALUES (?, ?, ?, ?, FALSE)",
            [req.userId, `J'ai terminé "${task.title}" 🔥`, "task_completed", taskId]
        )

        res.json({ message: "Task completed", xp: 10 })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error completing task" })
    }
})

module.exports = router