const express = require("express")
const db = require("../config/db")

const router = express.Router()


// CREATE habit.

router.post("/", async (req, res) => {
    const {
        name, type, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day, start_date,
        theme_ids  // ← ajoute ça
    } = req.body

    const [result] = await db.execute(`
        INSERT INTO habits (
            user_id, name, type, category, emoji, color,
            frequency, difficulty, reminder_time,
            is_private, motivation, triggers,
            relapse_plan, danger_level, times_per_day, start_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        req.userId, name, type || "build", category || "other",
        emoji || null, color || "#6366f1", frequency || "daily",
        difficulty || "medium", reminder_time || null,
        is_private || false, motivation || null,
        triggers || null, relapse_plan || null,
        danger_level || "low", times_per_day || 1,
        start_date || null
    ])

    const habitId = result.insertId

    // ← insère les thèmes (max 3)
    if (Array.isArray(theme_ids) && theme_ids.length > 0) {
        const limitedThemes = theme_ids.slice(0, 3)
        for (const themeId of limitedThemes) {
            await db.execute(
                "INSERT IGNORE INTO habit_themes (habit_id, theme_id) VALUES (?, ?)",
                [habitId, themeId]
            )
        }
    }

    const [rows] = await db.execute("SELECT * FROM habits WHERE id = ?", [habitId])
    res.json({ ...rows[0], streak: 0, bestStreak: 0, doneToday: false, todayCount: 0, relapseCount: 0, sparkCount: 0, theme_ids: theme_ids?.slice(0, 3) ?? [] })
})


// GET habits belonging to the authenticated user.
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT h.*,
                (SELECT COUNT(*) FROM habit_logs hl
                 WHERE hl.habit_id = h.id AND hl.user_id = h.user_id
                   AND hl.type = 'success' AND DATE(hl.logged_at) = CURDATE()) AS todayCount,
                (SELECT COUNT(DISTINCT DATE(hl.logged_at)) FROM habit_logs hl
                 WHERE hl.habit_id = h.id AND hl.user_id = h.user_id AND hl.type = 'success') AS totalSuccess,
                (SELECT COUNT(*) FROM habit_logs hl
                 WHERE hl.habit_id = h.id AND hl.user_id = h.user_id AND hl.type = 'relapse') AS relapseCount,
                (SELECT MAX(hl.logged_at) FROM habit_logs hl
                 WHERE hl.habit_id = h.id AND hl.user_id = h.user_id AND hl.type = 'relapse') AS lastRelapse
            FROM habits h
            WHERE h.user_id = ? AND h.is_active = TRUE
            ORDER BY h.created_at DESC
        `, [req.userId]);

        res.json(rows.map(h => {
            const todayCount = Number(h.todayCount) || 0;
            const timesPerDay = Number(h.times_per_day) || 1;
            return {
                ...h,
                todayCount,
                totalSuccess: Number(h.totalSuccess) || 0,
                relapseCount: Number(h.relapseCount) || 0,
                doneToday: todayCount >= timesPerDay,
                streak: 0,
                bestStreak: 0,
                sparkCount: 0,
                hadSparkYesterday: false
            };
        }));
    } catch (err) {
        console.error("Error fetching habits:", err);
        res.status(500).json({ message: "Error fetching habits" });
    }
});

// PUT modifier une habitude
router.put("/:id", async (req, res) => {
    const {
        name, category, emoji, color,
        frequency, difficulty, reminder_time,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day, start_date
    } = req.body

    await db.execute(`
        UPDATE habits SET
            name = ?, category = ?, emoji = ?, color = ?,
            frequency = ?, difficulty = ?, reminder_time = ?,
            is_private = ?, motivation = ?, triggers = ?,
            relapse_plan = ?, danger_level = ?,
            times_per_day = ?, start_date = ?
        WHERE id = ? AND user_id = ?
    `, [
        name, category, emoji, color,
        frequency, difficulty, reminder_time || null,
        is_private, motivation, triggers,
        relapse_plan, danger_level,
        times_per_day || 1, start_date || null,
        req.params.id, req.userId
    ])

    const [rows] = await db.execute("SELECT * FROM habits WHERE id = ?", [req.params.id])
    res.json(rows[0])
})


// DELETE archiver une habitude
router.delete("/:id", async (req, res) => {
    await db.execute(
        "UPDATE habits SET is_active = FALSE WHERE id = ? AND user_id = ?",
        [req.params.id, req.userId]
    )
    res.json({ message: "Habit archived" })
})


// POST log success: only updates the selected habit and authenticated user.
router.post("/:id/success", async (req, res) => {
    const connection = await db.getConnection();
    try {
        const habitId = Number(req.params.id);
        if (!Number.isInteger(habitId) || habitId <= 0) {
            return res.status(400).json({ message: "Invalid habit id" });
        }

        await connection.beginTransaction();

        const [habits] = await connection.execute(
            "SELECT id, difficulty, times_per_day FROM habits WHERE id = ? AND user_id = ? AND is_active = 1 FOR UPDATE",
            [habitId, req.userId]
        );
        if (habits.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Habit not found" });
        }

        const habit = habits[0];
        const timesPerDay = Number(habit.times_per_day) || 1;
        const [[{ todayCount: currentCount }]] = await connection.execute(
            `SELECT COUNT(*) AS todayCount FROM habit_logs
             WHERE habit_id = ? AND user_id = ? AND type = 'success'
             AND DATE(logged_at) = CURDATE()`,
            [habitId, req.userId]
        );

        if (Number(currentCount) >= timesPerDay) {
            await connection.rollback();
            return res.status(400).json({
                message: "Already completed today",
                todayCount: Number(currentCount),
                isFullDay: true
            });
        }

        const todayCount = Number(currentCount) + 1;
        const isFullDay = todayCount >= timesPerDay;
        const xpMap = { easy: 5, medium: 15, hard: 30, extreme: 50 };
        const fullXp = xpMap[habit.difficulty] ?? 15;
        const isSpark = !isFullDay && todayCount === 1;
        const xpGained = isFullDay ? fullXp : (isSpark ? Math.round(fullXp * 0.2) : 0);

        // habit_logs has no "note" column; xp_gained is part of its actual schema.
        await connection.execute(
            "INSERT INTO habit_logs (habit_id, user_id, type, xp_gained) VALUES (?, ?, 'success', ?)",
            [habitId, req.userId, xpGained]
        );

        await connection.execute(
            "UPDATE habits SET total_completions = total_completions + 1, current_streak = current_streak + 1 WHERE id = ? AND user_id = ?",
            [habitId, req.userId]
        );

        if (xpGained > 0) {
            await connection.execute(
                "UPDATE users SET xp = xp + ? WHERE id = ?",
                [xpGained, req.userId]
            );
        }

        await connection.commit();
        return res.json({ message: "Success logged", xpGained, isSpark, todayCount, isFullDay });
    } catch (err) {
        await connection.rollback();
        console.error("Error logging habit success:", err);
        return res.status(500).json({ message: "Unable to log success" });
    } finally {
        connection.release();
    }
});

// DELETE undo today's last success
router.delete("/:id/success", async (req, res) => {
    // ✅ FIX: DATE(logged_at) = CURDATE() ici aussi
    await db.execute(
        `DELETE FROM habit_logs
         WHERE habit_id = ?
           AND user_id = ?
           AND type = 'success'
           AND DATE(logged_at) = CURDATE()
         ORDER BY logged_at DESC
         LIMIT 1`,
        [req.params.id, req.userId]
    )
    res.json({ message: "Success removed" })
})


// GET heatmap d'une habitude
router.get("/:id/heatmap", async (req, res) => {
    const [logs] = await db.execute(`
        SELECT
            DATE_FORMAT(logged_at, '%Y-%m-%d') as date,
            type
        FROM habit_logs
        WHERE habit_id = ? AND user_id = ? AND logged_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
        ORDER BY logged_at ASC
    `, [req.params.id, req.userId])

    res.json(logs)
})


// GET milestones d'une habitude
router.get("/:id/milestones", async (req, res) => {
    const [milestones] = await db.execute(
        "SELECT * FROM habit_milestones WHERE habit_id = ? AND user_id = ? ORDER BY days ASC",
        [req.params.id, req.userId]
    )
    res.json(milestones)
})


module.exports = router

