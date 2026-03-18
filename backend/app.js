const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./src/routes/auth.routes')
const taskRoutes = require('./src/routes/tasks.routes')   // ✅ sans 's'
const themeRoutes = require('./src/routes/themes.routes') // ✅ sans 's'
const profilRoutes = require('./src/routes/profil.routes')
const objectiveRoutes = require('./src/routes/objective.routes')
const flowRoutes = require('./src/routes/flow.routes')
const communityRoutes = require('./src/routes/community.routes')

const authMiddleware = require('./src/middleware/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/tasks', authMiddleware, taskRoutes)
app.use('/api/themes', authMiddleware, themeRoutes)
app.use('/api/profil', authMiddleware, profilRoutes)
app.use('/api/objectives', authMiddleware, objectiveRoutes)
app.use('/api/flow', authMiddleware, flowRoutes)
app.use('/api/community', authMiddleware, communityRoutes)


app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`)
})