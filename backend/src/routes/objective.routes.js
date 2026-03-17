const express = require("express")
const db = require("../config/db")

const router = express.Router()

// GET tous les objectifs de l'user
router.get("/", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM objectives WHERE user_id = ? ORDER BY created_at DESC",
        [req.userId]
    )
    res.json(rows)
})

// GET le catalogue
router.get("/templates", async (req, res) => {
    const [rows] = await db.execute(
        "SELECT * FROM objective_templates ORDER BY category ASC"
    )
    res.json(rows)
})

// POST créer un objectif perso
router.post("/", async (req, res) => {
    const { title, description, emoji, theme_id, target_value, target_unit, deadline } = req.body

    const [result] = await db.execute(
        "INSERT INTO objectives (user_id, title, description, emoji, theme_id, target_value, target_unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [req.userId, title, description || null, emoji || null, theme_id || null, target_value || null, target_unit || null, deadline || null]
    )

    const [rows] = await db.execute("SELECT * FROM objectives WHERE id = ?", [result.insertId])
    res.json(rows[0])
})

// POST adopter un template
router.post("/adopt/:templateId", async (req, res) => {
    const { deadline } = req.body

    const [templates] = await db.execute(
        "SELECT * FROM objective_templates WHERE id = ?",
        [req.params.templateId]
    )

    if (templates.length === 0) return res.status(404).json({ message: "Template not found" })

    const t = templates[0]

    const computedDeadline = deadline || (t.suggested_days
        ? new Date(Date.now() + t.suggested_days * 86400000).toISOString().split("T")[0]
        : null)

    const [result] = await db.execute(
        "INSERT INTO objectives (user_id, template_id, title, description, emoji, target_value, target_unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [req.userId, t.id, t.title, t.description, t.emoji, t.target_value, t.target_unit, computedDeadline]
    )

    const [rows] = await db.execute("SELECT * FROM objectives WHERE id = ?", [result.insertId])
    res.json(rows[0])
})

// PUT mettre à jour la progression
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

// PUT changer le statut (abandon)
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