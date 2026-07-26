const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        console.log("========== GET /themes ==========");
        console.log("User ID :", req.userId);

        const [allThemes] = await db.execute(`
            SELECT id, name, user_id, is_default
            FROM themes
            ORDER BY id
        `);

        console.log("Toutes les lignes de themes :");
        console.table(allThemes);

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
               OR user_id = ?
            ORDER BY is_default DESC, created_at DESC
            `,
            [req.userId]
        );

        console.log("Résultat de la requête finale :");
        console.table(rows);

        res.json(rows);

    } catch (err) {
        console.error("Erreur GET /themes :", err);
        res.status(500).json({ message: "Error fetching themes" });
    }
});
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
            [req.userId, name, emoji || null, color || "#6366f1"]
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
        console.error(err)
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
            return res.status(404).json({ message: "Theme not found" })
        }

        res.json({ message: "Theme deleted" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error deleting theme" })
    }
})

module.exports = router