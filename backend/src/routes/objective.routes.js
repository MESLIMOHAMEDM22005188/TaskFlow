const express = require("express")
const db = require("../config/db")

const router = express.Router()

router.get("/", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM objectives WHERE user_id = ? ORDER BY created_at DESC",
        [req.userId]
    )
    res.json(rows)
})

router.get("/templates", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM objective_templates ORDER BY category ASC"
    )
    res.json(rows)
})

router.post("/", async (req, res) => {
    const { title, description, emoji, theme_id, target_value, target_unit, deadline } = req.body

    const [result] = await db.execute(
        "INSERT INTO objectives (user_id, title, description, emoji, theme_id, target_value, target_unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [req.userId, title, description || null, emoji || null, theme_id || null, target_value || null, target_unit || null, deadline || null]
    )

    const [rows] = await db.execute("SELECT * FROM objectives WHERE id = ?", [result.insertId])
    res.json(rows[0])
})

router.post("/adopt/:templateId", async (req, res) =>
{
    console.log(">>> ROUTE ADOPT APPELÉE <<<");
    try {
        const { deadline } = req.body

        // Vérifie si le template existe
        const [templates] = await db.execute(
            "SELECT * FROM objective_templates WHERE id = ?",
            [req.params.templateId]
        )

        if (templates.length === 0) {
            return res.status(404).json({ message: "Template not found" })
        }

        const t = templates[0]

        // Empêche les doublons
        const [existing] = await db.execute(
            `SELECT id
             FROM objectives
             WHERE user_id = ?
               AND template_id = ?
               AND status = 'active'
             LIMIT 1`,
            [req.userId, t.id]
        )

        if (existing.length > 0) {
            return res.status(400).json({
                message: "Vous avez déjà adopté cet objectif."
            })
        }

        const computedDeadline = deadline || (
            t.suggested_days
                ? new Date(Date.now() + t.suggested_days * 86400000)
                    .toISOString()
                    .split("T")[0]
                : null
        )

        const [result] = await db.execute(
            `INSERT INTO objectives
            (user_id, template_id, title, description, emoji, target_value, target_unit, deadline)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId,
                t.id,
                t.title,
                t.description,
                t.emoji,
                t.target_value,
                t.target_unit,
                computedDeadline
            ]
        )

        const [rows] = await db.execute(
            "SELECT * FROM objectives WHERE id = ?",
            [result.insertId]
        )

        res.json(rows[0])

    }
    catch (err) {
        console.error("POST /objectives/adopt:", err);

        return res.status(500).json({
            message: "Error adopting objective",
            error: err.message,
            code: err.code
        });
    }})

    router.put("/:id/progress", async (req, res) => {
    const { current_value } = req.body

    const [objectives] = await db.execute(
        "SELECT * FROM objectives WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )

    if (objectives.length === 0) return res.status(404).json({ message: "Objective not found" })

    const obj = objectives[0]
    const completed = obj.target_value && current_value >= obj.target_value

    await db.execute(
        "UPDATE objectives SET current_value = ?, status = ? WHERE id = ? AND user_id = ?",
        [current_value, completed ? "completed" : "active", req.params.id, req.userId]
    )

    const [rows] = await db.execute("SELECT * FROM objectives WHERE id = ?", [req.params.id])
    res.json(rows[0])
})

router.put("/:id/status", async (req, res) => {
    const { status } = req.body

    await db.execute(
        "UPDATE objectives SET status = ? WHERE id = ? AND user_id = ?",
        [status, req.params.id, req.userId]
    )

    const [rows] = await db.execute("SELECT * FROM objectives WHERE id = ?", [req.params.id])
    res.json(rows[0])
})

// DELETE supprimer un objectif
router.delete("/:id", async (req, res) => {
    await db.execute(
        "DELETE FROM objectives WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )
    res.json({ message: "Objective deleted" })
})

module.exports = router