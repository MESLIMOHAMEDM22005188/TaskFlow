const express = require("express")
const db = require("../config/db")
const { updateAchievements } = require("../services/achievement.service")

const router = express.Router()

let taskSchedulingSchemaPromise = null

// Expand the legacy task schema safely on first use. Existing task rows keep
// their current frequency and completion data.
async function ensureTaskSchedulingSchema() {
    if (!taskSchedulingSchemaPromise) {
        taskSchedulingSchemaPromise = (async () => {
            const [columns] = await db.execute("SHOW COLUMNS FROM tasks")
            const byName = new Map(columns.map(column => [column.Field, String(column.Type || "").toLowerCase()]))

            if (byName.has("frequency") && byName.get("frequency").startsWith("enum(")) {
                await db.execute("ALTER TABLE tasks MODIFY COLUMN frequency VARCHAR(20) NOT NULL DEFAULT 'daily'")
            }

            const additions = [
                ["recurrence_interval", "INT UNSIGNED NOT NULL DEFAULT 1"],
                ["recurrence_days", "TEXT NULL"],
                ["recurrence_month_days", "TEXT NULL"],
                ["recurrence_dates", "TEXT NULL"],
                ["target_per_period", "INT UNSIGNED NOT NULL DEFAULT 1"],
                ["scheduled_time", "TIME NULL"],
                ["start_date", "DATE NULL"],
                ["end_date", "DATE NULL"],
            ]
            for (const [name, definition] of additions) {
                if (!byName.has(name)) {
                    try {
                        await db.execute(`ALTER TABLE tasks ADD COLUMN ${name} ${definition}`)
                    } catch (error) {
                        // Another web worker may have added this column concurrently.
                        if (error.code !== "ER_DUP_FIELDNAME") throw error
                    }
                }
            }
        })().catch(error => {
            taskSchedulingSchemaPromise = null
            throw error
        })
    }
    await taskSchedulingSchemaPromise
}

function parseJsonArray(value) {
    if (Array.isArray(value)) return value
    if (typeof value !== "string" || !value.trim()) return []
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function dateOnly(value) {
    if (!value) return null
    if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    }
    const text = String(value)
    return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null
}

function parseDateOnly(value) {
    const text = dateOnly(value)
    if (!text) return null
    const [year, month, day] = text.split("-").map(Number)
    const date = new Date(year, month - 1, day, 12)
    return Number.isNaN(date.getTime()) ? null : date
}

function dayDifference(a, b) {
    const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
    const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
    return Math.floor((utcA - utcB) / 86400000)
}

function isTaskDueToday(task) {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const start = parseDateOnly(task.start_date)
    const end = parseDateOnly(task.end_date)
    if (start && today < start) return false
    if (end && today > end) return false

    const frequency = ["once", "daily", "weekly", "monthly", "yearly"].includes(task.frequency)
        ? task.frequency : "daily"
    if (frequency === "once") return true

    const anchor = parseDateOnly(task.start_date) || parseDateOnly(task.created_at) || today
    const interval = Math.max(1, Number(task.recurrence_interval || 1))
    const days = parseJsonArray(task.recurrence_days).map(Number).filter(day => day >= 1 && day <= 7)
    const monthDays = parseJsonArray(task.recurrence_month_days).map(Number).filter(day => day >= 1 && day <= 31)
    const annualDates = parseJsonArray(task.recurrence_dates).filter(value => /^\d{2}-\d{2}$/.test(String(value)))

    if (frequency === "daily") {
        const distance = dayDifference(today, anchor)
        if (distance < 0 || distance % interval !== 0) return false
        const isoWeekday = today.getDay() === 0 ? 7 : today.getDay()
        return days.length === 0 || days.includes(isoWeekday)
    }

    if (frequency === "weekly") {
        const anchorMonday = new Date(anchor)
        anchorMonday.setDate(anchorMonday.getDate() - ((anchorMonday.getDay() + 6) % 7))
        const todayMonday = new Date(today)
        todayMonday.setDate(todayMonday.getDate() - ((todayMonday.getDay() + 6) % 7))
        const weekDistance = Math.floor(dayDifference(todayMonday, anchorMonday) / 7)
        if (weekDistance < 0) return false
        const isoWeekday = today.getDay() === 0 ? 7 : today.getDay()
        const anchorWeekday = anchor.getDay() === 0 ? 7 : anchor.getDay()
        // The interval defines a cycle of N calendar weeks, not a single active week.
        // With a single-occurrence goal and no selected days, use the anchor weekday.
        if (Number(task.target_per_period || 1) <= 1 && days.length === 0) {
            return weekDistance % interval === 0 && isoWeekday === anchorWeekday
        }
        return days.length ? days.includes(isoWeekday) : true
    }

    if (frequency === "monthly") {
        const monthDistance = (today.getFullYear() - anchor.getFullYear()) * 12 + today.getMonth() - anchor.getMonth()
        if (monthDistance < 0) return false
        const monthInCycle = monthDistance % interval
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
        if (!monthDays.length && Number(task.target_per_period || 1) > 1) return true
        if (!monthDays.length && monthInCycle !== 0) return false
        const selectedDays = monthDays.length ? monthDays : [anchor.getDate()]
        return selectedDays.some(day => today.getDate() === Math.min(day, lastDay))
    }

    const yearDistance = today.getFullYear() - anchor.getFullYear()
    if (yearDistance < 0) return false
    const yearInCycle = yearDistance % interval
    if (!annualDates.length && Number(task.target_per_period || 1) > 1) return true
    if (!annualDates.length && yearInCycle !== 0) return false
    const fallbackDate = `${String(anchor.getMonth() + 1).padStart(2, "0")}-${String(anchor.getDate()).padStart(2, "0")}`
    const dateChoices = annualDates.length ? annualDates : [fallbackDate]
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    if (todayMonthDay === "02-28" && !annualDates.length && fallbackDate === "02-29") return true
    return dateChoices.includes(todayMonthDay)
}


function formatSqlDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function addMonths(date, amount) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)
}

// Bounds for the active recurring cycle; end is exclusive.
function getTaskPeriodBounds(task, now = new Date()) {
    if (!["weekly", "monthly", "yearly"].includes(task.frequency)) return null
    const anchor = parseDateOnly(task.start_date) || parseDateOnly(task.created_at)
    if (!anchor) return null
    const interval = Math.max(1, Number(task.recurrence_interval || 1))
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)

    if (task.frequency === "weekly") {
        const firstWeek = new Date(anchor)
        firstWeek.setDate(firstWeek.getDate() - ((firstWeek.getDay() + 6) % 7))
        const currentWeek = new Date(today)
        currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() + 6) % 7))
        const weekDistance = Math.floor(dayDifference(currentWeek, firstWeek) / 7)
        if (weekDistance < 0) return null
        const cycleIndex = Math.floor(weekDistance / interval)
        const start = new Date(firstWeek)
        start.setDate(start.getDate() + cycleIndex * interval * 7)
        const end = new Date(start)
        end.setDate(end.getDate() + interval * 7)
        const firstCycleStart = cycleIndex === 0 && anchor > start ? anchor : start
        return { start: formatSqlDate(firstCycleStart), end: formatSqlDate(end) }
    }

    if (task.frequency === "monthly") {
        const monthDistance = (today.getFullYear() - anchor.getFullYear()) * 12 + today.getMonth() - anchor.getMonth()
        if (monthDistance < 0) return null
        const cycleIndex = Math.floor(monthDistance / interval)
        const start = addMonths(new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12), cycleIndex * interval)
        const end = addMonths(start, interval)
        const cycleStart = cycleIndex === 0 && anchor > start ? anchor : start
        return { start: formatSqlDate(cycleStart), end: formatSqlDate(end) }
    }

    const yearDistance = today.getFullYear() - anchor.getFullYear()
    if (yearDistance < 0) return null
    const cycleIndex = Math.floor(yearDistance / interval)
    const start = new Date(anchor.getFullYear() + cycleIndex * interval, 0, 1, 12)
    const end = new Date(start.getFullYear() + interval, 0, 1, 12)
    const cycleStart = cycleIndex === 0 && anchor > start ? anchor : start
    return { start: formatSqlDate(cycleStart), end: formatSqlDate(end) }
}

function normalizeIntegerArray(value, min, max, limit) {
    if (!Array.isArray(value)) return []
    return [...new Set(value.map(Number).filter(number => Number.isInteger(number) && number >= min && number <= max))]
        .sort((a, b) => a - b)
        .slice(0, limit)
}

function normalizeAnnualDates(value) {
    if (!Array.isArray(value)) return []
    const valid = value.map(String).filter(value => {
        if (!/^\d{2}-\d{2}$/.test(value)) return false
        const [month, day] = value.split("-").map(Number)
        const date = new Date(2000, month - 1, day, 12)
        return date.getMonth() === month - 1 && date.getDate() === day
    })
    return [...new Set(valid)].sort().slice(0, 30)
}

// Create the multi-theme relation table lazily so older production databases
// can still serve tasks and accept new ones after deployment.
async function ensureTaskThemesTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS task_themes (
            task_id BIGINT NOT NULL,
            theme_id BIGINT NOT NULL,
            PRIMARY KEY (task_id, theme_id),
            KEY idx_task_themes_theme_id (theme_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
}

router.get("/", async (req, res) => {
    try {
        await ensureTaskThemesTable()
        await ensureTaskSchedulingSchema()
        const today = new Date().toISOString().split("T")[0]

        const [tasks] = await db.execute(`
            SELECT
                t.*,
                COALESCE(ds.count, 0) as today_count,
                COALESCE((
                    SELECT COUNT(*)
                    FROM task_completions tc
                    WHERE tc.task_id = t.id
                      AND tc.user_id = t.user_id
                      AND (
                        t.frequency = 'once'
                        OR (
                            t.frequency = 'daily'
                            AND FLOOR(DATEDIFF(DATE(tc.completed_at), COALESCE(t.start_date, DATE(t.created_at))) / GREATEST(t.recurrence_interval, 1))
                                = FLOOR(DATEDIFF(CURDATE(), COALESCE(t.start_date, DATE(t.created_at))) / GREATEST(t.recurrence_interval, 1))
                        )
                        OR (
                            t.frequency = 'weekly'
                            AND FLOOR(DATEDIFF(
                                DATE(tc.completed_at),
                                DATE_SUB(COALESCE(t.start_date, DATE(t.created_at)), INTERVAL WEEKDAY(COALESCE(t.start_date, DATE(t.created_at))) DAY)
                            ) / (7 * GREATEST(t.recurrence_interval, 1)))
                                = FLOOR(DATEDIFF(
                                    CURDATE(),
                                    DATE_SUB(COALESCE(t.start_date, DATE(t.created_at)), INTERVAL WEEKDAY(COALESCE(t.start_date, DATE(t.created_at))) DAY)
                                ) / (7 * GREATEST(t.recurrence_interval, 1)))
                        )
                        OR (
                            t.frequency = 'monthly'
                            AND FLOOR(PERIOD_DIFF(DATE_FORMAT(DATE(tc.completed_at), '%Y%m'), DATE_FORMAT(COALESCE(t.start_date, DATE(t.created_at)), '%Y%m')) / GREATEST(t.recurrence_interval, 1))
                                = FLOOR(PERIOD_DIFF(DATE_FORMAT(CURDATE(), '%Y%m'), DATE_FORMAT(COALESCE(t.start_date, DATE(t.created_at)), '%Y%m')) / GREATEST(t.recurrence_interval, 1))
                        )
                        OR (
                            t.frequency = 'yearly'
                            AND FLOOR((YEAR(DATE(tc.completed_at)) - YEAR(COALESCE(t.start_date, DATE(t.created_at)))) / GREATEST(t.recurrence_interval, 1))
                                = FLOOR((YEAR(CURDATE()) - YEAR(COALESCE(t.start_date, DATE(t.created_at)))) / GREATEST(t.recurrence_interval, 1))
                        )
                      )
                ), 0) AS period_count,
                COALESCE(ds.done, FALSE) as done_today,
                th.name as theme_name,
                th.emoji as theme_emoji,
                th.color as theme_color
            FROM tasks t
                     LEFT JOIN task_daily_state ds
                               ON ds.task_id = t.id
                                   AND ds.user_id = ?
                                   AND ds.date = ?
                     LEFT JOIN themes th ON th.id = t.theme_id
            WHERE t.user_id = ? AND COALESCE(t.status, 'active') <> 'archived'
            ORDER BY
                FIELD(t.priority, 'High', 'Medium', 'Low'),
                t.deadline ASC,
                t.created_at DESC
        `, [req.userId, today, req.userId])

        if (tasks.length === 0) return res.json([])

        // Charger les thèmes multi depuis task_themes
        const taskIds = tasks.map(t => t.id)
        const placeholders = taskIds.map(() => "?").join(",")
        const [taskThemes] = await db.execute(`
            SELECT tt.task_id, th.id, th.name, th.emoji, th.color
            FROM task_themes tt
            JOIN themes th ON th.id = tt.theme_id
            WHERE tt.task_id IN (${placeholders})
        `, taskIds)

        const themesByTask = {}
        taskThemes.forEach(tt => {
            if (!themesByTask[tt.task_id]) themesByTask[tt.task_id] = []
            themesByTask[tt.task_id].push({ id: tt.id, name: tt.name, emoji: tt.emoji, color: tt.color })
        })

        // Ajouter themes[] à chaque tâche
        const result = tasks.map(t => ({
            ...t,
            recurrence_days: parseJsonArray(t.recurrence_days),
            recurrence_month_days: parseJsonArray(t.recurrence_month_days),
            recurrence_dates: parseJsonArray(t.recurrence_dates),
            period_count: Number(t.period_count || 0),
            period_done: Number(t.period_count || 0) >= Math.max(1, Number(t.target_per_period || 1)),
            is_due_today: isTaskDueToday(t),
            // Anciennes tâches créées avec le statut "todo" : les exposer comme actives
            // pour rester compatibles avec les filtres et types du frontend.
            status: t.status === "todo" ? "active" : t.status,
            // Compatibility with tasks created before task_themes existed.
            themes: themesByTask[t.id] ?? (t.theme_id ? [{
                id: Number(t.theme_id),
                name: t.theme_name,
                emoji: t.theme_emoji,
                color: t.theme_color
            }] : [])
        }))

        res.json(result)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching tasks" })
    }
})

router.post("/", async (req, res) => {
    try {
        await ensureTaskThemesTable()
        await ensureTaskSchedulingSchema()
        const {
            title, priority, theme_id, theme_ids, frequency, deadline, note, completion_target,
            recurrence_interval, recurrence_days, recurrence_month_days, recurrence_dates,
            target_per_period, scheduled_time, start_date, end_date,
        } = req.body

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Task title is required." })
        }
        const allowedFrequencies = ["once", "daily", "weekly", "monthly", "yearly"]
        if (frequency !== undefined && !allowedFrequencies.includes(frequency)) {
            return res.status(400).json({ message: "Invalid task frequency." })
        }
        const taskFrequency = frequency || "daily"
        const interval = Math.min(365, Math.max(1, Number.parseInt(recurrence_interval, 10) || 1))
        const periodTarget = Math.min(60, Math.max(1, Number.parseInt(target_per_period, 10) || 1))
        const dailyTarget = Math.min(30, Math.max(1, Number.parseInt(completion_target, 10) || 1))
        const selectedWeekdays = normalizeIntegerArray(recurrence_days, 1, 7, 7)
        const selectedMonthDays = normalizeIntegerArray(recurrence_month_days, 1, 31, 31)
        const selectedAnnualDates = normalizeAnnualDates(recurrence_dates)
        const validDate = value => {
            if (value == null || value === "") return true
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
            const [year, month, day] = value.split("-").map(Number)
            const parsed = new Date(year, month - 1, day, 12)
            return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
        }
        if (!validDate(start_date) || !validDate(end_date) || !validDate(deadline)) {
            return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD." })
        }
        if (start_date && end_date && end_date < start_date) {
            return res.status(400).json({ message: "The end date must be on or after the start date." })
        }
        const normalizedTime = scheduled_time == null || scheduled_time === "" ? null : String(scheduled_time)
        if (normalizedTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) {
            return res.status(400).json({ message: "Invalid scheduled time. Use HH:MM." })
        }

        // Construire la liste des ids — priorité à theme_ids, fallback sur theme_id
        const ids = Array.isArray(theme_ids) && theme_ids.length > 0
            ? theme_ids.slice(0, 3)
            : (theme_id ? [theme_id] : [])

        // On garde theme_id sur la tâche pour la compatibilité
        const mainThemeId = ids[0] ?? theme_id ?? null

        // Force un statut visible dans la liste après rechargement.
        // La route GET ne retourne que les tâches active/done : ne pas dépendre
        // du statut par défaut défini dans le schéma SQL.
        const [result] = await db.execute(
            `INSERT INTO tasks (
                user_id, theme_id, title, priority, frequency, deadline, note, completion_target, status,
                recurrence_interval, recurrence_days, recurrence_month_days, recurrence_dates,
                target_per_period, scheduled_time, start_date, end_date
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.userId, mainThemeId, title.trim(), priority || "Medium", taskFrequency,
                deadline || null, note || null, dailyTarget,
                interval,
                selectedWeekdays.length ? JSON.stringify(selectedWeekdays) : null,
                selectedMonthDays.length ? JSON.stringify(selectedMonthDays) : null,
                selectedAnnualDates.length ? JSON.stringify(selectedAnnualDates) : null,
                periodTarget,
                normalizedTime,
                start_date || null,
                end_date || null,
            ]
        )

        const taskId = result.insertId

        // Insérer tous les thèmes dans task_themes
        if (ids.length > 0) {
            const placeholders = ids.map(() => "(?, ?)").join(", ")
            const params = ids.flatMap((themeId) => [taskId, themeId])
            await db.execute(
                `INSERT IGNORE INTO task_themes (task_id, theme_id) VALUES ${placeholders}`,
                params
            )
        }

        const [[task]] = await db.execute("SELECT * FROM tasks WHERE id = ?", [taskId])

        const [themes] = ids.length > 0
            ? await db.execute(
                `SELECT id, name, emoji, color FROM themes WHERE id IN (${ids.map(() => "?").join(",")})`,
                ids
            )
            : [[], []]

        res.json({
            ...task,
            recurrence_days: parseJsonArray(task.recurrence_days),
            recurrence_month_days: parseJsonArray(task.recurrence_month_days),
            recurrence_dates: parseJsonArray(task.recurrence_dates),
            target_per_period: Number(task.target_per_period || 1),
            recurrence_interval: Number(task.recurrence_interval || 1),
            period_count: 0,
            period_done: false,
            is_due_today: isTaskDueToday(task),
            themes,
        })

    } catch (err) {
        console.error("[Grindly:Tasks] Error creating task:", err)
        res.status(500).json({ message: "Error creating task" })
    }
})

/**
 * Update a task's editable fields and schedule without touching completion history.
 * The ownership check is applied to every read/write.
 */
router.put("/:id", async (req, res) => {
    let connection
    let transactionStarted = false
    try {
        await ensureTaskThemesTable()
        await ensureTaskSchedulingSchema()

        const {
            title, priority, theme_id, theme_ids, frequency, deadline, note, completion_target,
            recurrence_interval, recurrence_days, recurrence_month_days, recurrence_dates,
            target_per_period, scheduled_time, start_date, end_date,
        } = req.body

        if (typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Task title is required." })
        }
        const allowedPriorities = ["Low", "Medium", "High"]
        const allowedFrequencies = ["once", "daily", "weekly", "monthly", "yearly"]
        if (priority !== undefined && !allowedPriorities.includes(priority)) {
            return res.status(400).json({ message: "Invalid task priority." })
        }
        if (frequency !== undefined && !allowedFrequencies.includes(frequency)) {
            return res.status(400).json({ message: "Invalid task frequency." })
        }
        const taskFrequency = frequency || "daily"
        const interval = Math.min(365, Math.max(1, Number.parseInt(recurrence_interval, 10) || 1))
        const periodTarget = Math.min(60, Math.max(1, Number.parseInt(target_per_period, 10) || 1))
        const dailyTarget = Math.min(30, Math.max(1, Number.parseInt(completion_target, 10) || 1))
        const selectedWeekdays = normalizeIntegerArray(recurrence_days, 1, 7, 7)
        const selectedMonthDays = normalizeIntegerArray(recurrence_month_days, 1, 31, 31)
        const selectedAnnualDates = normalizeAnnualDates(recurrence_dates)

        const validDate = value => {
            if (value == null || value === "") return true
            if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
            const [year, month, day] = value.split("-").map(Number)
            const parsed = new Date(year, month - 1, day, 12)
            return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
        }
        if (!validDate(start_date) || !validDate(end_date) || !validDate(deadline)) {
            return res.status(400).json({ message: "Invalid date. Use YYYY-MM-DD." })
        }
        if (start_date && end_date && end_date < start_date) {
            return res.status(400).json({ message: "The end date must be on or after the start date." })
        }

        const normalizedTime = scheduled_time == null || scheduled_time === "" ? null : String(scheduled_time)
        if (normalizedTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(normalizedTime)) {
            return res.status(400).json({ message: "Invalid scheduled time. Use HH:MM." })
        }

        const ids = Array.isArray(theme_ids) && theme_ids.length > 0
            ? normalizeIntegerArray(theme_ids, 1, Number.MAX_SAFE_INTEGER, 3)
            : (theme_id ? [Number(theme_id)] : [])
        const mainThemeId = ids[0] ?? null

        connection = await db.getConnection()
        await connection.beginTransaction()
        transactionStarted = true

        const [[existing]] = await connection.execute(
            "SELECT id FROM tasks WHERE id = ? AND user_id = ? AND COALESCE(status, 'active') <> 'archived' FOR UPDATE",
            [req.params.id, req.userId]
        )
        if (!existing) {
            await connection.rollback()
            transactionStarted = false
            return res.status(404).json({ message: "Task not found." })
        }

        await connection.execute(
            `UPDATE tasks SET
                title = ?, priority = ?, theme_id = ?, frequency = ?, deadline = ?, note = ?,
                completion_target = ?, recurrence_interval = ?, recurrence_days = ?,
                recurrence_month_days = ?, recurrence_dates = ?, target_per_period = ?,
                scheduled_time = ?, start_date = ?, end_date = ?
             WHERE id = ? AND user_id = ?`,
            [
                title.trim(), priority || "Medium", mainThemeId, taskFrequency, deadline || null,
                note || null, dailyTarget, interval,
                selectedWeekdays.length ? JSON.stringify(selectedWeekdays) : null,
                selectedMonthDays.length ? JSON.stringify(selectedMonthDays) : null,
                selectedAnnualDates.length ? JSON.stringify(selectedAnnualDates) : null,
                periodTarget, normalizedTime, start_date || null, end_date || null,
                req.params.id, req.userId,
            ]
        )

        await connection.execute("DELETE FROM task_themes WHERE task_id = ?", [req.params.id])
        if (ids.length > 0) {
            const placeholders = ids.map(() => "(?, ?)").join(", ")
            await connection.execute(
                `INSERT IGNORE INTO task_themes (task_id, theme_id) VALUES ${placeholders}`,
                ids.flatMap(themeId => [req.params.id, themeId])
            )
        }

        await connection.commit()
        transactionStarted = false

        const [[task]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )
        const [themes] = ids.length > 0
            ? await db.execute(
                `SELECT id, name, emoji, color FROM themes WHERE id IN (${ids.map(() => "?").join(",")})`,
                ids
            )
            : [[]]

        res.json({
            ...task,
            recurrence_days: parseJsonArray(task.recurrence_days),
            recurrence_month_days: parseJsonArray(task.recurrence_month_days),
            recurrence_dates: parseJsonArray(task.recurrence_dates),
            recurrence_interval: Number(task.recurrence_interval || 1),
            target_per_period: Number(task.target_per_period || 1),
            is_due_today: isTaskDueToday(task),
            themes,
        })
    } catch (err) {
        if (connection && transactionStarted) {
            try { await connection.rollback() } catch (rollbackError) {
                console.error("[Grindly:Tasks] Rollback failed:", rollbackError)
            }
        }
        console.error("[Grindly:Tasks] Error updating task:", err)
        res.status(500).json({ message: "Error updating task" })
    } finally {
        if (connection) connection.release()
    }
})

// DELETE task
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.execute(
            "UPDATE tasks SET status = 'archived', archived_at = NOW() WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" })
        }

        res.json({ message: "Task archived" })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error archiving task" })
    }
})
// GET today completions
router.get("/completions/today", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0]

        const [rows] = await db.execute(`
            SELECT task_id, count as today_count, done as done_today
            FROM task_daily_state
            WHERE user_id = ? AND date = ?
        `, [req.userId, today])

        res.json(rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching completions" })
    }
})

router.get("/history", async (req, res) => {
    try {
        const [tasks] = await db.execute(`
            SELECT
                t.*,
                COUNT(tc.id) as total_completions,
                DATEDIFF(
                    COALESCE(t.completed_at, t.archived_at, NOW()),
                    t.created_at
                ) as lifespan_days,
                th.name  as theme_name,
                th.emoji as theme_emoji,
                th.color as theme_color
            FROM tasks t
            LEFT JOIN task_completions tc ON tc.task_id = t.id
            LEFT JOIN themes th ON th.id = t.theme_id
            WHERE t.user_id = ?
              AND t.status IN ('done', 'archived')
            GROUP BY t.id
            ORDER BY COALESCE(t.completed_at, t.archived_at) DESC
            LIMIT 100
        `, [req.userId])

        res.json(tasks)

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error fetching history" })
    }
})
// COMPLETE task
router.post("/:id/complete", async (req, res) => {
    try {
        await ensureTaskSchedulingSchema()
        const taskId = req.params.id
        const today = formatSqlDate(new Date())

        const [[task]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ? AND COALESCE(status, 'active') <> 'archived'",
            [taskId, req.userId]
        )
        if (!task) return res.status(404).json({ message: "Task not found" })

        const dueToday = isTaskDueToday(task)
        const allowOffSchedule = req.body?.allow_off_schedule === true
        if (!dueToday && !allowOffSchedule) {
            return res.status(400).json({
                message: "Cette tâche n'est pas prévue aujourd'hui. Tu peux tout de même la valider pour gagner le bonus.",
                code: "TASK_OFF_SCHEDULE",
                canCompleteAnyway: true,
                bonusXp: 5,
            })
        }

        if (["weekly", "monthly", "yearly"].includes(task.frequency)) {
            const bounds = getTaskPeriodBounds(task)
            const target = Math.max(1, Number(task.target_per_period || 1))
            if (bounds) {
                const [[periodState]] = await db.execute(
                    `SELECT COUNT(*) AS count
                     FROM task_completions
                     WHERE task_id = ? AND user_id = ?
                       AND completed_at >= ? AND completed_at < ?`,
                    [taskId, req.userId, bounds.start, bounds.end]
                )
                if (Number(periodState?.count || 0) >= target) {
                    return res.status(400).json({ message: "L'objectif de cette période est déjà atteint." })
                }
            }
        }

        const bonusXp = dueToday ? 0 : 5
        const baseXp = 10
        const totalXp = baseXp + bonusXp

        // Use a transaction so the completion log and XP grant cannot diverge.
        const connection = await db.getConnection()
        try {
            await connection.beginTransaction()

            // Lock the task row to avoid two simultaneous clicks claiming XP twice.
            const [[lockedTask]] = await connection.execute(
                "SELECT id FROM tasks WHERE id = ? AND user_id = ? AND COALESCE(status, 'active') <> 'archived' FOR UPDATE",
                [taskId, req.userId]
            )
            if (!lockedTask) {
                await connection.rollback()
                return res.status(404).json({ message: "Task not found" })
            }

            await connection.execute(`
                INSERT INTO task_daily_state (task_id, user_id, date, count, done)
                VALUES (?, ?, ?, 1, (1 >= ?))
                ON DUPLICATE KEY UPDATE
                    count = count + 1,
                    done = (count + 1) >= ?
            `, [taskId, req.userId, today, task.completion_target, task.completion_target])

            await connection.execute(
                "INSERT INTO task_completions (task_id, user_id, completed_at) VALUES (?, ?, NOW())",
                [taskId, req.userId]
            )

            await connection.execute(`
                UPDATE tasks
                SET
                    completions_count = completions_count + 1,
                    status = CASE
                        WHEN frequency = 'once'
                             AND (completions_count + 1) >= completion_target THEN 'done'
                        ELSE 'active'
                    END,
                    completed_at = CASE
                        WHEN frequency = 'once'
                             AND (completions_count + 1) >= completion_target THEN NOW()
                        ELSE NULL
                    END
                WHERE id = ? AND user_id = ?
            `, [taskId, req.userId])

            await connection.execute(
                "UPDATE users SET xp = xp + ? WHERE id = ?",
                [totalXp, req.userId]
            )

            await connection.commit()
        } catch (error) {
            try { await connection.rollback() } catch (rollbackError) {
                console.error("[Grindly:Tasks] Completion rollback failed:", rollbackError)
            }
            throw error
        } finally {
            connection.release()
        }

        try {
            await updateAchievements(req.userId)
        } catch (achievementError) {
            // Task completion should succeed even if an achievement refresh fails.
            console.error("[Grindly:Tasks] Achievement refresh failed:", achievementError)
        }

        const [[updated]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            [taskId, req.userId]
        )

        res.json({
            task: updated,
            xp: totalXp,
            baseXp,
            bonusXp,
            completedOffSchedule: !dueToday,
        })
    } catch (err) {
        console.error("[Grindly:Tasks] Error completing task:", err)
        res.status(500).json({ message: "Error completing task" })
    }
})
// UNDO task
router.delete("/:id/complete", async (req, res) => {
    try {
        const taskId = req.params.id
        const today = new Date().toISOString().split("T")[0]

        // Vérifier que la tâche appartient bien à l'utilisateur avant toute modification.
        const [[task]] = await db.execute(
            "SELECT id, completion_target, status FROM tasks WHERE id = ? AND user_id = ?",
            [taskId, req.userId]
        )
        if (!task) return res.status(404).json({ message: "Task not found" })

        const [[state]] = await db.execute(
            "SELECT count FROM task_daily_state WHERE task_id = ? AND user_id = ? AND date = ?",
            [taskId, req.userId, today]
        )
        const currentCount = Number(state?.count || 0)
        if (currentCount < 1) {
            return res.status(400).json({ message: "Nothing to undo today" })
        }

        // Retirer une seule complétion du jour et recalculer le seuil correctement.
        const nextCount = currentCount - 1
        const target = Math.max(1, Number(task.completion_target || 1))
        await db.execute(`
            UPDATE task_daily_state
            SET count = ?,
                done = (? >= ?)
            WHERE task_id = ? AND user_id = ? AND date = ?
        `, [nextCount, nextCount, target, taskId, req.userId, today])

        // Retirer la complétion la plus récente de cette journée, pas une ancienne.
        await db.execute(`
            DELETE FROM task_completions
            WHERE id = (
                SELECT id FROM (
                    SELECT id
                    FROM task_completions
                    WHERE task_id = ? AND user_id = ? AND DATE(completed_at) = ?
                    ORDER BY completed_at DESC, id DESC
                    LIMIT 1
                ) AS latest_completion
            )
        `, [taskId, req.userId, today])

        // Mettre à jour le compteur global et le statut pour les tâches ponctuelles.
        await db.execute(`
            UPDATE tasks
            SET
                completions_count = GREATEST(0, completions_count - 1),
                status = CASE
                    WHEN frequency = 'once' AND status = 'done' THEN 'active'
                    ELSE status
                END,
                completed_at = CASE
                    WHEN frequency = 'once' AND status = 'done' THEN NULL
                    ELSE completed_at
                END
            WHERE id = ? AND user_id = ?
        `, [taskId, req.userId])

        await db.execute(
            "UPDATE users SET xp = GREATEST(0, xp - 10) WHERE id = ?",
            [req.userId]
        )

        const [[updated]] = await db.execute(
            "SELECT * FROM tasks WHERE id = ?",
            [taskId]
        )

        res.json({ task: updated, xp: -10 })

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error undoing completion" })
    }
})

router.put("/:id/restore", async (req, res) => {
    try {
        const [result] = await db.execute(
            "UPDATE tasks SET status = 'active', archived_at = NULL, completed_at = NULL WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )
        if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found" })
        const [[task]] = await db.execute("SELECT * FROM tasks WHERE id = ?", [req.params.id])
        res.json(task)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Error restoring task" })
    }
})

router.delete("/:id/permanent", async (req, res) => {
    let connection
    let transactionStarted = false
    try {
        connection = await db.getConnection()
        await connection.beginTransaction()
        transactionStarted = true

        const [[task]] = await connection.execute(
            "SELECT id FROM tasks WHERE id = ? AND user_id = ? FOR UPDATE",
            [req.params.id, req.userId]
        )
        if (!task) {
            await connection.rollback()
            return res.status(404).json({ message: "Task not found" })
        }

        // Nettoyer les dépendances avant la suppression pour éviter les erreurs
        // de clés étrangères et garder la suppression atomique.
        await connection.execute("DELETE FROM task_themes WHERE task_id = ?", [req.params.id])
        await connection.execute("DELETE FROM task_daily_state WHERE task_id = ? AND user_id = ?", [req.params.id, req.userId])
        await connection.execute("DELETE FROM task_completions WHERE task_id = ? AND user_id = ?", [req.params.id, req.userId])
        await connection.execute("UPDATE flow_sessions SET task_id = NULL WHERE task_id = ?", [req.params.id])

        await connection.execute(
            "DELETE FROM tasks WHERE id = ? AND user_id = ?",
            [req.params.id, req.userId]
        )

        await connection.commit()
        res.json({ message: "Task permanently deleted" })
    } catch (err) {
        if (connection && transactionStarted) {
            try { await connection.rollback() } catch (rollbackError) {
                console.error("[Grindly:Tasks] Rollback failed:", rollbackError)
            }
        }
        console.error("[Grindly:Tasks] Permanent delete failed:", err)
        res.status(500).json({ message: "Error deleting task", detail: err.message })
    } finally {
        if (connection) connection.release()
    }
})

module.exports = router
