const jwt = require("jsonwebtoken")

function authMiddleware(req, res, next) {
    const header = req.headers.authorization

    if (!header) {
        return res.status(401).json({ message: "Authentication required" })
    }

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Invalid authorization header" })
    }

    const token = header.split(" ")[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.userId
        next()
    } catch {
        res.status(401).json({ message: "Invalid or expired token" })
    }
}

module.exports = authMiddleware
