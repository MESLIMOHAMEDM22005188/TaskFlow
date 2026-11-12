const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `
                SELECT
                    id,
                    name,
                    emoji,
                    color,
                    is_default
                FROM themes
                WHERE is_default = 1
                   OR user_id IS NULL
                   OR user_id = ?
                ORDER BY is_default DESC, created_at DESC
            `,
            [req.userId]
        )

        // Les thèmes standards peuvent exister à la fois dans le catalogue global
        // et dans les anciens comptes où ils étaient copiés à l'inscription.
        // On conserve une seule entrée par nom normalisé pour l'interface.
        const seenNames = new Set()
        const uniqueRows = rows.filter(theme => {
            const key = String(theme.name || "")
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[\u200B-\u200D\uFEFF]/g, "")
                .replace(/\s+/g, " ")
                .trim()
                .toLocaleLowerCase("fr-FR")
            if (!key || seenNames.has(key)) return false
            seenNames.add(key)
            return true
        })

        res.json(uniqueRows)

    } catch (err) {
        console.error("GET /themes:", err)
        res.status(500).json({ message: "Error fetching themes" })
    }
})

router.post("/", async (req, res) => {
    try {
        const { name, emoji, color } = req.body

        const [[existing]] = await db.execute(
            `
                SELECT id
                FROM themes
                WHERE LOWER(name) = LOWER(?)
                  AND (is_default = 1 OR user_id = ?)
                    LIMIT 1
            `,
            [name.trim(), req.userId]
        )

        if (existing) {
            return res.status(400).json({
                message: "A theme with this name already exists."
            })
        }

        const [result] = await db.execute(
            `
                INSERT INTO themes (user_id, name, emoji, color, is_default)
                VALUES (?, ?, ?, ?, 0)
            `,
            [req.userId, name.trim(), emoji || null, color || "#6366f1"]
        )

        const [[theme]] = await db.execute(
            "SELECT * FROM themes WHERE id = ?",
            [result.insertId]
        )

        const [[{ themesCount }]] = await db.execute(
            "SELECT COUNT(*) AS themesCount FROM themes WHERE user_id = ?",
            [req.userId]
        )

        await db.execute(
            `
                INSERT INTO user_achievements (user_id, achievement_id, progress, completed)
                SELECT ?, a.id, ?, ? >= a.goal
                FROM achievements a
                WHERE a.type = 'themes'
                    ON DUPLICATE KEY UPDATE
                                         progress = ?,
                                         completed = ? >= a.goal
            `,
            [req.userId, themesCount, themesCount, themesCount, themesCount]
        )

        res.json(theme)

    } catch (err) {
        console.error("POST /themes:", err)
        res.status(500).json({ message: "Error creating theme" })
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.execute(
            `
                DELETE FROM themes
                WHERE id = ?
                  AND user_id = ?
                  AND is_default = 0
            `,
            [req.params.id, req.userId]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Theme not found"
            })
        }

        res.json({ message: "Theme deleted" })

    } catch (err) {
        console.error("DELETE /themes:", err)
        res.status(500).json({ message: "Error deleting theme" })
    }
})

module.exports = router