const jwt = require("jsonwebtoken")
const db = require("../config/db")

async function authenticateToken(req, res, next) {
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required." })
    }
    const token = authorizationHeader.slice(7).trim()
    if (!token || token.includes(" ")) return res.status(401).json({ message: "Invalid authorization header." })
    let decodedToken
    try {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured")
        decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    } catch (_error) {
        return res.status(401).json({ message: "Invalid or expired token." })
    }
    if (!decodedToken || !Number.isSafeInteger(Number(decodedToken.userId)) || Number(decodedToken.userId) < 1) {
        return res.status(401).json({ message: "Invalid token claims." })
    }
    try {
        const userId = Number(decodedToken.userId)
        const [[user]] = await db.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [userId])
        if (!user) return res.status(401).json({ message: "Account unavailable." })
        // Best-effort activity heartbeat. Presence must never block authentication.
        try {
            await db.execute("INSERT INTO moderation_presence (user_id,last_seen_at) VALUES (?,NOW()) ON DUPLICATE KEY UPDATE last_seen_at=NOW()", [userId])
        } catch (presenceError) {
            if (process.env.NODE_ENV !== "production") console.warn("[Grindly:Presence] Heartbeat unavailable", presenceError.message)
        }
        const [[ban]] = await db.execute(
            "SELECT id, action, expires_at FROM moderation_sanctions WHERE target_user_id = ? AND action IN ('temp_ban','permanent_ban') AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 1",
            [userId]
        )
        if (ban) return res.status(403).json({ message: "Account suspended by moderation.", code: "ACCOUNT_BANNED", expiresAt: ban.expires_at || null })
        req.userId = userId
        next()
    } catch (error) {
        console.error("[Grindly:Auth] Authentication check failed", error)
        return res.status(503).json({ message: "Authentication service temporarily unavailable." })
    }
}
module.exports = authenticateToken
