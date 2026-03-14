const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const themeRoutes = require('./routes/theme.routes');
const authMiddleware = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/themes', authMiddleware, themeRoutes);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
