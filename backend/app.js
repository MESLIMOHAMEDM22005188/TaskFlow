const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const authRoutes = require('./src/routes/auth.routes')
const taskRoutes = require('./src/routes/tasks.routes')
const themeRoutes = require('./src/routes/themes.routes')
const profilRoutes = require('./src/routes/profil.routes')
const objectiveRoutes = require('./src/routes/objective.routes')
const flowRoutes = require('./src/routes/flow.routes')
const communityRoutes = require('./src/routes/community.routes')
const uploadRoutes = require('./src/routes/upload.routes')
const statsRoutes = require('./src/routes/stats.routes')
const authMiddleware = require('./src/middleware/auth')
const habitsRoutes = require('./src/routes/habits.routes')

const app = express()

app.use(cors())
app.use(express.json())
app.use("/sounds", express.static(path.join(__dirname, "public/sounds")))

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/tasks', authMiddleware, taskRoutes)
app.use('/api/themes', authMiddleware, themeRoutes)
app.use('/api/profil', authMiddleware, profilRoutes)
app.use('/api/objectives', authMiddleware, objectiveRoutes)
app.use('/api/flow', authMiddleware, flowRoutes)
app.use('/api/community', authMiddleware, communityRoutes)
app.use('/api/upload', authMiddleware, uploadRoutes)
app.use('/api/stats', authMiddleware, statsRoutes)
app.use('/api/habits', authMiddleware, habitsRoutes)

// Serve frontend
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(frontendPath))

// Catch-all React Router
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
})

// AlwaysData requires IPv6 + PORT
const PORT = process.env.PORT || 8100
const HOST = '::'

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`)
})
