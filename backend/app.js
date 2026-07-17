const fs = require("fs")
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const path = require("path")
require("dotenv").config()

const authRoutes = require("./src/routes/auth.routes")
const taskRoutes = require("./src/routes/tasks.routes")
const themeRoutes = require("./src/routes/themes.routes")
const profilRoutes = require("./src/routes/profil.routes")
const objectiveRoutes = require("./src/routes/objective.routes")
const flowRoutes = require("./src/routes/flow.routes")
const communityRoutes = require("./src/routes/community.routes")
const uploadRoutes = require("./src/routes/upload.routes")
const statsRoutes = require("./src/routes/stats.routes")
const habitsRoutes = require("./src/routes/habits.routes")
const preferenceRoutes = require("./src/routes/preference.routes")
const accountRoutes = require("./src/routes/account.routes")
const authMiddleware = require("./src/middleware/auth")

const app = express()
const frontendPath = path.resolve(__dirname, "..", "frontend", "dist")
const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://grindly.alwaysdata.net",
]
const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many authentication attempts. Try again later." },
})

app.set("trust proxy", 1)
app.disable("x-powered-by")

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}))
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error("Origin not allowed by CORS"))
    },
}))
app.use(express.json({ limit: "1mb" }))
app.use(express.urlencoded({ extended: false, limit: "1mb" }))
app.use("/sounds", express.static(path.join(__dirname, "public", "sounds"), {
    fallthrough: false,
    maxAge: "1d",
}))

app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
})

app.get("/api/test", (_req, res) => {
    res.json({
        ok: true,
        message: "Backend works",
    })
})

app.use("/api/auth/login", authLimiter)
app.use("/api/auth/signup", authLimiter)
app.use("/api/auth", authRoutes)
app.use("/api/tasks", authMiddleware, taskRoutes)
app.use("/api/themes", authMiddleware, themeRoutes)
app.use("/api/profil", authMiddleware, profilRoutes)
app.use("/api/objectives", authMiddleware, objectiveRoutes)
app.use("/api/flow", authMiddleware, flowRoutes)
app.use("/api/community", authMiddleware, communityRoutes)
app.use("/api/upload", authMiddleware, uploadRoutes)
app.use("/api/stats", authMiddleware, statsRoutes)
app.use("/api/habits", authMiddleware, habitsRoutes)
app.use("/api/preferences", authMiddleware, preferenceRoutes)
app.use("/api/account", authMiddleware, accountRoutes)

if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath, {
        index: false,
        maxAge: "1h",
    }))

    app.get("/", (_req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"))
    })

    app.get(/^\/(?!api(?:\/|$)).+/, (_req, res) => {
        res.sendFile(path.join(frontendPath, "index.html"))
    })
}

app.use((err, _req, res, _next) => {
    console.error(err)

    if (res.headersSent) {
        return
    }

    res.status(err.status || 500).json({
        message: err.status === 429 ? err.message : "Internal server error",
    })
})

const PORT = Number(process.env.PORT) || 8100
const HOST = process.env.HOST || "0.0.0.0"

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`)
})
