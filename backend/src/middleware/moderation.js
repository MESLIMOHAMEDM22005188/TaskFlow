const db = require("../config/db")

function configuredAdminIds() {
    return new Set(String(process.env.GRINDLY_ADMIN_USER_IDS || "").split(",").map(v => v.trim()).filter(v => /^\d+$/.test(v)).map(v => String(Number(v))))
}
async function requireModerator(req, res, next) {
    try {
        const id = String(req.userId || "")
        if (!id) return res.status(401).json({ message: "Authentication required" })
        if (configuredAdminIds().has(id)) { req.moderationRole = "admin"; return next() }
        const [rows] = await db.execute("SELECT role FROM moderation_roles WHERE user_id = ? LIMIT 1", [req.userId])
        if (!["admin", "moderator"].includes(rows[0]?.role)) return res.status(403).json({ message: "Moderator access required" })
        req.moderationRole = rows[0].role
        next()
    } catch (error) {
        console.error("[Grindly:Moderation] Permission check failed", error)
        res.status(503).json({ message: "Moderation service unavailable" })
    }
}
function requireAdmin(req, res, next) {
    if (req.moderationRole !== "admin") return res.status(403).json({ message: "Administrator access required" })
    next()
}
module.exports = { requireModerator, requireAdmin, configuredAdminIds }
