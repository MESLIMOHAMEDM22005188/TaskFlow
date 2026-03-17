const jwt = require("jsonwebtoken")

function authMiddleware(req, res, next) {
    const header = req.headers.authorization

    if (!header) return res.status(401).json({ message: "No token" })

    const token = header.split(" ")[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.userId
        next()
    } catch {
        res.status(401).json({ message: "Invalid token" })
    }
}

module.exports = authMiddleware