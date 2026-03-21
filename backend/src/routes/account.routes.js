const express = require("express")
const db = require("../config/db")

const router = express.Router()

// ================================
// GET /api/account/export
// Export RGPD — toutes les données de l'utilisateur en JSON
// ================================
router.get("/export", async (req, res) => {
    try {
        const userId = req.userId

        const [[user]] = await db.execute(
            "SELECT id, email, username, bio, avatar_url, xp, created_at FROM users WHERE id = ?",
            [userId]
        )

        const [tasks] = await db.execute(
            "SELECT * FROM tasks WHERE user_id = ?",
            [userId]
        )

        const [taskCompletions] = await db.execute(
            "SELECT * FROM task_completions WHERE user_id = ?",
            [userId]
        )

        const [themes] = await db.execute(
            "SELECT * FROM themes WHERE user_id = ?",
            [userId]
        )

        const [habits] = await db.execute(
            "SELECT * FROM habits WHERE user_id = ?",
            [userId]
        )

        const [habitLogs] = await db.execute(
            "SELECT * FROM habit_logs WHERE user_id = ?",
            [userId]
        )

        const [habitMilestones] = await db.execute(
            "SELECT * FROM habit_milestones WHERE user_id = ?",
            [userId]
        )

        const [objectives] = await db.execute(
            "SELECT * FROM objectives WHERE user_id = ?",
            [userId]
        )

        const [flowSessions] = await db.execute(
            "SELECT * FROM flow_sessions WHERE user_id = ?",
            [userId]
        )

        const [flowSettings] = await db.execute(
            "SELECT * FROM flow_settings WHERE user_id = ?",
            [userId]
        )

        // Posts : on inclut les posts publics mais PAS les posts anonymes
        // (l'anonymat est garanti — on ne lie pas les posts anon à l'identité)
        const [posts] = await db.execute(
            "SELECT * FROM posts WHERE user_id = ? AND is_anonymous = FALSE",
            [userId]
        )

        const [comments] = await db.execute(
            "SELECT * FROM comments WHERE user_id = ? AND is_anonymous = FALSE",
            [userId]
        )

        const [groupMemberships] = await db.execute(
            `SELECT gm.*, g.name as group_name FROM group_members gm
             JOIN \`groups\` g ON g.id = gm.group_id
             WHERE gm.user_id = ?`,
            [userId]
        )

        const exportData = {
            export_date: new Date().toISOString(),
            export_version: "1.0",
            rgpd_notice: "Ces données sont exportées conformément au RGPD (Article 20 — Droit à la portabilité). Elles vous appartiennent.",
            account: {
                ...user,
                // On ne retourne PAS le mot de passe même hashé
                password: "[non exporté pour des raisons de sécurité]"
            },
            tasks,
            task_completions: taskCompletions,
            themes,
            habits,
            habit_logs: habitLogs,
            habit_milestones: habitMilestones,
            objectives,
            flow_sessions: flowSessions,
            flow_settings: flowSettings[0] ?? null,
            community: {
                posts,
                comments,
                group_memberships: groupMemberships,
                anonymous_posts: "[non exportés — l'anonymat est garanti et ces posts ne sont pas liés à votre identité]"
            }
        }

        res.setHeader("Content-Type", "application/json")
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="taskflow-mes-donnees-${new Date().toISOString().split("T")[0]}.json"`
        )
        res.json(exportData)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Erreur lors de l'export" })
    }
})

// ================================
// DELETE /api/account/delete
// Suppression de compte — RGPD droit à l'oubli
// ================================
router.delete("/delete", async (req, res) => {
    try {
        const userId = req.userId

        // Ordre de suppression respectant les FK

        // 1. Likes et commentaires
        await db.execute("DELETE FROM post_likes WHERE user_id = ?", [userId])
        await db.execute("DELETE FROM comments WHERE user_id = ?", [userId])

        // 2. Posts (inclut les anonymes — supprimés sans révéler le lien)
        await db.execute("DELETE FROM posts WHERE user_id = ?", [userId])

        // 3. Groupes
        await db.execute("DELETE FROM group_members WHERE user_id = ?", [userId])

        // 4. Habitudes et logs
        await db.execute("DELETE FROM habit_logs WHERE user_id = ?", [userId])
        await db.execute("DELETE FROM habit_milestones WHERE user_id = ?", [userId])
        await db.execute("DELETE FROM habits WHERE user_id = ?", [userId])

        // 5. Tâches et completions
        await db.execute("DELETE FROM task_completions WHERE user_id = ?", [userId])
        await db.execute("DELETE FROM tasks WHERE user_id = ?", [userId])

        // 6. Thèmes
        await db.execute("DELETE FROM themes WHERE user_id = ?", [userId])

        // 7. Objectifs
        await db.execute("DELETE FROM objectives WHERE user_id = ?", [userId])

        // 8. Flow
        await db.execute("DELETE FROM flow_sessions WHERE user_id = ?", [userId])
        await db.execute("DELETE FROM flow_settings WHERE user_id = ?", [userId])

        // 9. Notifications
        await db.execute("DELETE FROM notifications WHERE user_id = ?", [userId]).catch(() => {})

        // 10. Compte utilisateur
        await db.execute("DELETE FROM users WHERE id = ?", [userId])

        res.json({ message: "Compte supprimé avec succès" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Erreur lors de la suppression du compte" })
    }
})

module.exports = router