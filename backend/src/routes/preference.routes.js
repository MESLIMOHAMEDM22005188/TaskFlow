const express = require("express")
const db = require("../config/db")
const router = express.Router()

// GET — charger les préférences
router.get("/", async (req, res) => {
    try {
        const [[user]] = await db.execute(`
            SELECT
                accent_color, bg_preset, dark_mode, compact_mode, reduced_motion, language,
                notif_habits, notif_milestones, notif_community_likes, notif_community_comments,
                notif_flow_reminders, notif_weekly_recap, notif_relapse_support,
                privacy_profile_public, privacy_show_xp, privacy_show_streaks,
                privacy_appear_leaderboard, privacy_default_posts_private, privacy_default_habits_private
            FROM users WHERE id = ?
        `, [req.userId])

        if (!user) return res.status(404).json({ message: "User not found" })
        res.json(user)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching preferences" })
    }
})

// PUT — sauvegarder les préférences
router.put("/", async (req, res) => {
    try {
        const {
            accent_color, bg_preset, dark_mode, compact_mode, reduced_motion, language,
            notif_habits, notif_milestones, notif_community_likes, notif_community_comments,
            notif_flow_reminders, notif_weekly_recap, notif_relapse_support,
            privacy_profile_public, privacy_show_xp, privacy_show_streaks,
            privacy_appear_leaderboard, privacy_default_posts_private, privacy_default_habits_private
        } = req.body

        await db.execute(`
            UPDATE users SET
                accent_color = ?,
                bg_preset = ?,
                dark_mode = ?,
                compact_mode = ?,
                reduced_motion = ?,
                language = ?,
                notif_habits = ?,
                notif_milestones = ?,
                notif_community_likes = ?,
                notif_community_comments = ?,
                notif_flow_reminders = ?,
                notif_weekly_recap = ?,
                notif_relapse_support = ?,
                privacy_profile_public = ?,
                privacy_show_xp = ?,
                privacy_show_streaks = ?,
                privacy_appear_leaderboard = ?,
                privacy_default_posts_private = ?,
                privacy_default_habits_private = ?
            WHERE id = ?
        `, [
            accent_color ?? '#6366f1',
            bg_preset ?? 'navy',
            dark_mode ?? 1,
            compact_mode ?? 0,
            reduced_motion ?? 0,
            language ?? 'fr',
            notif_habits ?? 1,
            notif_milestones ?? 1,
            notif_community_likes ?? 1,
            notif_community_comments ?? 1,
            notif_flow_reminders ?? 0,
            notif_weekly_recap ?? 1,
            notif_relapse_support ?? 1,
            privacy_profile_public ?? 1,
            privacy_show_xp ?? 1,
            privacy_show_streaks ?? 1,
            privacy_appear_leaderboard ?? 1,
            privacy_default_posts_private ?? 0,
            privacy_default_habits_private ?? 0,
            req.userId
        ])

        res.json({ message: "Preferences saved" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error saving preferences" })
    }
})

module.exports = router