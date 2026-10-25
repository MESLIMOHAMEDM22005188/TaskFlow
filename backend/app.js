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
const LOG_PREFIX = "[Grindly:Server]"
const startedAt = Date.now()
const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "https://grindlyy.alwaysdata.net",
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

console.info(LOG_PREFIX, "Booting", {
    node: process.version,
    environment: process.env.NODE_ENV || "unspecified",
    port: process.env.PORT || "8100",
    host: process.env.HOST || "0.0.0.0",
    frontendPath,
    frontendExists: fs.existsSync(frontendPath),
    frontendIndexExists: fs.existsSync(path.join(frontendPath, "index.html")),
    databaseConfigPresent: Boolean(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)),
    allowedOrigins,
})

app.use((req, res, next) => {
    const startedAt = Date.now()
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    res.setHeader("X-Request-Id", requestId)
    console.info(LOG_PREFIX, "→", requestId, req.method, req.originalUrl)
    res.on("finish", () => {
        const line = {
            requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Date.now() - startedAt,
            contentLength: res.getHeader("content-length") || null,
        }
        const logger = res.statusCode >= 500 ? console.error : res.statusCode >= 400 ? console.warn : console.info
        logger.call(console, LOG_PREFIX, "←", line)
    })
    next()
})

process.on("unhandledRejection", reason => {
    console.error(LOG_PREFIX, "UNHANDLED REJECTION", reason)
})
process.on("uncaughtException", error => {
    console.error(LOG_PREFIX, "UNCAUGHT EXCEPTION", error)
    process.exit(1)
})

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}))
function isPrivateDevelopmentOrigin(origin) {
    if (process.env.NODE_ENV === "production" || !origin) return false

    try {
        const parsed = new URL(origin)
        if (parsed.protocol !== "http:") return false

        const hostname = parsed.hostname
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
            return true
        }

        const octets = hostname.split(".").map(Number)
        if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) {
            return false
        }

        return octets[0] === 10 ||
            (octets[0] === 192 && octets[1] === 168) ||
            (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
            (octets[0] === 169 && octets[1] === 254)
    } catch {
        return false
    }
}

app.use(cors({
    origin(origin, callback) {
        console.debug(LOG_PREFIX, "CORS origin check", origin || "(no origin)")
        if (!origin || allowedOrigins.includes(origin) || isPrivateDevelopmentOrigin(origin)) {
            return callback(null, true)
        }
        console.warn(LOG_PREFIX, "Blocked CORS origin", origin)
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
    res.json({ ok: true, uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) })
})

app.get("/api/test", (_req, res) => {
    res.json({ ok: true, message: "Backend works" })
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
    console.info(LOG_PREFIX, "Serving frontend from", frontendPath)
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
} else {
    console.error(LOG_PREFIX, "Frontend dist directory is missing:", frontendPath)
}

app.use((err, req, res, _next) => {
    console.error(LOG_PREFIX, "Express error", {
        method: req.method,
        path: req.originalUrl,
        status: err.status || 500,
        message: err.message,
        stack: err.stack,
    })

    if (res.headersSent) return
    res.status(err.status || 500).json({
        message: err.status === 429 ? err.message : "Internal server error",
    })
})

const PORT = Number(process.env.PORT) || 8100
const HOST = process.env.HOST || "0.0.0.0"

const server = app.listen(PORT, HOST, () => {
    console.info(LOG_PREFIX, "LISTENING", { address: `http://${HOST}:${PORT}`, pid: process.pid })
})
server.on("error", error => console.error(LOG_PREFIX, "HTTP SERVER ERROR", error))
