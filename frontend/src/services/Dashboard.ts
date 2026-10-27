import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toggle, closeAll } from "./uiManager.ts"
import {
    getTasks, createTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask, permanentlyDeleteTask as apiPermanentlyDeleteTask,
    completeTask, uncompleteTask, getTodayCompletions,
    getThemes, createTheme, deleteTheme as apiDeleteTheme,
} from "../services/taskService"
import type { Task, Theme, TaskDailyState } from "../services/taskService.ts"

type Notification = { id: number; message: string; created_at: string; read?: boolean }

function normalizeThemeName(value: string | null | undefined) {
    return (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("fr-FR")
}

export function useDashboard() {

    const navigate = useNavigate()

    const [dark, setDark] = useState(
        () => typeof document === "undefined" || !document.documentElement.classList.contains("light-mode")
    )
    const [tasks, setTasks] = useState<Task[]>([])
    const [themes, setThemes] = useState<Theme[]>([])
    const [dailyState, setDailyState] = useState<Map<number, TaskDailyState>>(new Map())
    const [notifications] = useState<Notification[]>([])

    useEffect(() => {
        const syncTheme = (event: Event) => {
            const detail = (event as CustomEvent<{ lightMode?: boolean }>).detail
            setDark(!(detail?.lightMode ?? document.documentElement.classList.contains("light-mode")))
        }
        window.addEventListener("grindly-theme-change", syncTheme)
        return () => window.removeEventListener("grindly-theme-change", syncTheme)
    }, [])

    // Form task
    const [newTask, setNewTask] = useState("")
    const [priority, setPriority] = useState("Medium")
    const [themeIds, setThemeIds] = useState<number[]>([])
    const [frequency, setFrequency] = useState("daily")
    const [recurrenceInterval, setRecurrenceInterval] = useState(1)
    const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
    const [recurrenceMonthDays, setRecurrenceMonthDays] = useState<number[]>([])
    const [recurrenceDates, setRecurrenceDates] = useState<string[]>([])
    const [targetPerPeriod, setTargetPerPeriod] = useState(1)
    const [scheduledTime, setScheduledTime] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [deadline, setDeadline] = useState("")
    const [note, setNote] = useState("")
    const [completionTarget, setCompletionTarget] = useState(1)
    const [editingTaskId, setEditingTaskId] = useState<number | null>(null)

    // Form theme
    const [themeName, setThemeName] = useState("")
    const [themeEmoji, setThemeEmoji] = useState("")
    const [themeColor, setThemeColor] = useState("#6366f1")

    const [showTaskForm, setShowTaskForm] = useState(false)
    const [showThemeForm, setShowThemeForm] = useState(false)

    function buildDailyMap(states: TaskDailyState[]): Map<number, TaskDailyState> {
        return new Map(states.map(s => [s.task_id, {
            ...s,
            done_today: Boolean(s.done_today),
            today_count: Number(s.today_count)
        }]))
    }

    useEffect(() => {
        let cancelled = false

        // Chaque ressource est chargée indépendamment : une erreur sur les thèmes
        // ou les complétions ne doit pas empêcher l'affichage des tâches.
        async function loadTasks() {
            try {
                const result = await getTasks()
                if (cancelled) return

                if (!Array.isArray(result)) {
                    console.error("GET /tasks n'a pas renvoyé une liste :", result)
                    setTasks([])
                    return
                }

                // La liste est affichée dès que la réponse des tâches arrive.
                setTasks(result)
            } catch (err) {
                console.error("Impossible de charger les tâches :", err)
            }
        }

        async function loadThemes() {
            try {
                const result = await getThemes()
                if (!cancelled) setThemes(Array.isArray(result) ? result : [])
            } catch (err) {
                console.error("Impossible de charger les thèmes :", err)
            }
        }

        async function loadDailyCompletions() {
            try {
                const result = await getTodayCompletions()
                if (!cancelled) {
                    setDailyState(buildDailyMap(Array.isArray(result) ? result : []))
                }
            } catch (err) {
                console.error("Impossible de charger les complétions du jour :", err)
            }
        }

        void loadTasks()
        void loadThemes()
        void loadDailyCompletions()

        return () => {
            cancelled = true
        }
    }, [])

    function toggleThemeSelection(id: number) {
        setThemeIds(prev => {
            if (prev.includes(id)) return prev.filter(t => t !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    function resetTaskFields() {
        setNewTask("")
        setPriority("Medium")
        setThemeIds([])
        setFrequency("daily")
        setRecurrenceInterval(1)
        setRecurrenceDays([])
        setRecurrenceMonthDays([])
        setRecurrenceDates([])
        setTargetPerPeriod(1)
        setScheduledTime("")
        setStartDate("")
        setEndDate("")
        setDeadline("")
        setNote("")
        setCompletionTarget(1)
        setEditingTaskId(null)
    }

    function handleToggleTaskForm() {
        setShowThemeForm(false)
        if (showTaskForm) {
            resetTaskFields()
            setShowTaskForm(false)
        } else {
            setShowTaskForm(true)
        }
    }

    function handleCancelTaskForm() {
        resetTaskFields()
        closeAll(setShowTaskForm, setShowThemeForm)
    }

    function handleEditTask(task: Task) {
        setNewTask(task.title || "")
        setPriority(task.priority || "Medium")
        setThemeIds(task.themes?.map(theme => Number(theme.id)) ?? (task.theme_id ? [Number(task.theme_id)] : []))
        setFrequency(["once", "daily", "weekly", "monthly", "yearly"].includes(task.frequency) ? task.frequency : "daily")
        setRecurrenceInterval(Math.max(1, Number(task.recurrence_interval || 1)))
        setRecurrenceDays(Array.isArray(task.recurrence_days) ? task.recurrence_days.map(Number) : [])
        setRecurrenceMonthDays(Array.isArray(task.recurrence_month_days) ? task.recurrence_month_days.map(Number) : [])
        setRecurrenceDates(Array.isArray(task.recurrence_dates) ? task.recurrence_dates.map(String) : [])
        setTargetPerPeriod(Math.max(1, Number(task.target_per_period || 1)))
        setScheduledTime(String(task.scheduled_time || "").slice(0, 5))
        setStartDate(String(task.start_date || "").slice(0, 10))
        setEndDate(String(task.end_date || "").slice(0, 10))
        setDeadline(String(task.deadline || "").slice(0, 10))
        setNote(task.note || "")
        setCompletionTarget(Math.max(1, Number(task.completion_target || 1)))
        setEditingTaskId(task.id)
        setShowThemeForm(false)
        setShowTaskForm(true)
    }

    function handleToggleThemeForm() {
        setShowTaskForm(false)
        toggle(setShowThemeForm)
    }

    async function handleCreateTask() {
        if (!newTask.trim()) return
        try {
            const task = await createTask({
                title: newTask,
                priority,
                theme_ids: themeIds,
                theme_id: themeIds[0] ?? null,  // compat
                frequency,
                recurrence_interval: recurrenceInterval,
                recurrence_days: recurrenceDays,
                recurrence_month_days: recurrenceMonthDays,
                recurrence_dates: recurrenceDates,
                target_per_period: targetPerPeriod,
                scheduled_time: scheduledTime || null,
                start_date: startDate || null,
                end_date: endDate || null,
                deadline: deadline || null,
                note: note || null,
                completion_target: completionTarget
            })
            setTasks(prev => [task, ...prev])
            resetTaskFields()
            closeAll(setShowTaskForm, setShowThemeForm)
        } catch (err) {
            console.error("Création de tâche impossible :", err)
            const message = err instanceof Error ? err.message : "Erreur inconnue"
            alert(`Impossible de créer la tâche. ${message}`)
        }
    }

    async function handleUpdateTask() {
        if (editingTaskId === null || !newTask.trim()) return
        const taskId = editingTaskId
        try {
            const updated = await apiUpdateTask(taskId, {
                title: newTask.trim(),
                priority,
                theme_ids: themeIds,
                theme_id: themeIds[0] ?? null,
                frequency,
                recurrence_interval: recurrenceInterval,
                recurrence_days: recurrenceDays,
                recurrence_month_days: recurrenceMonthDays,
                recurrence_dates: recurrenceDates,
                target_per_period: targetPerPeriod,
                scheduled_time: scheduledTime || null,
                start_date: startDate || null,
                end_date: endDate || null,
                deadline: deadline || null,
                note: note || null,
                completion_target: completionTarget,
            })
            setTasks(previous => previous.map(task => task.id === taskId
                ? { ...task, ...updated, themes: updated.themes ?? task.themes }
                : task))
            resetTaskFields()
            closeAll(setShowTaskForm, setShowThemeForm)
        } catch (err) {
            console.error("Modification de tâche impossible :", err)
            const message = err instanceof Error ? err.message : "Erreur inconnue"
            alert(`Impossible de modifier la tâche. ${message}`)
        }
    }

    async function handleCreateTheme() {
        const cleanedName = themeName.trim()
        if (!cleanedName) return
        if (themes.some(theme => normalizeThemeName(theme.name) === normalizeThemeName(cleanedName))) {
            alert("Un thème portant ce nom existe déjà. Choisis un autre nom pour éviter les doublons.")
            return
        }
        try {
            const theme = await createTheme({ name: cleanedName, emoji: themeEmoji || undefined, color: themeColor })
            setThemes(prev => [theme, ...prev])
            setThemeName("")
            setThemeEmoji("")
            setThemeColor("#6366f1")
            closeAll(setShowTaskForm, setShowThemeForm)
        } catch (err) {
            console.error(err)
            alert("Failed to create theme")
        }
    }

    async function toggleDone(taskId: number) {
        const taskBefore = tasks.find(task => task.id === taskId)
        if (!taskBefore) return

        const state = dailyState.get(taskId)
        const isDone = state?.done_today ?? Boolean(taskBefore.done_today)
        try {
            if (isDone) {
                const { task } = await uncompleteTask(taskId)
                setTasks(prev => prev.map(t => {
                    if (t.id !== taskId) return t
                    return { ...t, ...task, done_today: false, period_count: Math.max(0, Number(t.period_count || 0) - 1) }
                }))
                setDailyState(prev => {
                    const next = new Map(prev)
                    const current = next.get(taskId) ?? { task_id: taskId, today_count: 1, done_today: true }
                    const todayCount = Math.max(0, Number(current.today_count || 0) - 1)
                    next.set(taskId, { ...current, today_count: todayCount, done_today: todayCount >= (task.completion_target || 1) })
                    return next
                })
                return
            }

            // A task outside its schedule can still be completed. Ask explicitly,
            // then let the API award the one-time-per-completion bonus.
            let allowOffSchedule = false
            if (taskBefore.is_due_today === false) {
                allowOffSchedule = window.confirm(
                    `« ${taskBefore.title} » n'est pas prévue aujourd'hui. La faire maintenant rapporte 10 XP + 5 XP bonus. La valider quand même ?`
                )
                if (!allowOffSchedule) return
            }

            const result = await completeTask(taskId, allowOffSchedule)
            const { task, xp, bonusXp = 0 } = result
            setTasks(prev => prev.map(t => {
                if (t.id !== taskId) return t
                return { ...t, ...task, period_count: Number(t.period_count || 0) + 1 }
            }))
            setDailyState(prev => {
                const next = new Map(prev)
                const current = next.get(taskId) ?? { task_id: taskId, today_count: 0, done_today: false }
                const newCount = Number(current.today_count || 0) + 1
                const doneToday = newCount >= (task.completion_target || 1)
                next.set(taskId, { ...current, today_count: newCount, done_today: doneToday })
                return next
            })
            if (bonusXp > 0) {
                alert(`Tâche accomplie ! +${xp} XP dont +${bonusXp} XP bonus pour l'avoir faite hors planning.`)
            }
        } catch (err) {
            console.error("Échec de la validation/annulation de la tâche :", err)
            alert(err instanceof Error ? err.message : "Action impossible. Vérifie ta connexion puis réessaie.")
        }
    }

    async function handleDeleteTask(taskId: number) {
        try {
            await apiDeleteTask(taskId)
            setTasks(prev => prev.filter(t => t.id !== taskId))
            setDailyState(prev => { const next = new Map(prev); next.delete(taskId); return next })
        } catch (err) { console.error(err) }
    }

    async function handleDeleteTheme(id: number) {
        try {
            await apiDeleteTheme(id)
            setThemes(prev => prev.filter(t => t.id !== id))
        } catch (err) { console.error(err) }
    }

    async function handleArchiveTask(taskId: number) {
        try {
            await apiDeleteTask(taskId)
            setTasks(prev => prev.filter(t => t.id !== taskId))
            setDailyState(prev => { const next = new Map(prev); next.delete(taskId); return next })
        } catch (err) { console.error(err) }
    }

    async function handlePermanentlyDeleteTask(taskId: number) {
        try {
            await apiPermanentlyDeleteTask(taskId)
            setTasks(prev => prev.filter(task => task.id !== taskId))
            setDailyState(prev => {
                const next = new Map(prev)
                next.delete(taskId)
                return next
            })
        } catch (err) {
            console.error("Impossible de supprimer définitivement la tâche :", err)
            alert("La suppression a échoué. Vérifie ta connexion puis réessaie.")
        }
    }

    return {
        navigate,
        dark, setDark,
        tasks, themes, dailyState, notifications,
        newTask, setNewTask,
        priority, setPriority,
        themeIds, toggleThemeSelection,
        frequency, setFrequency,
        recurrenceInterval, setRecurrenceInterval,
        recurrenceDays, setRecurrenceDays,
        recurrenceMonthDays, setRecurrenceMonthDays,
        recurrenceDates, setRecurrenceDates,
        targetPerPeriod, setTargetPerPeriod,
        scheduledTime, setScheduledTime,
        startDate, setStartDate,
        endDate, setEndDate,
        deadline, setDeadline,
        note, setNote,
        completionTarget, setCompletionTarget,
        themeName, setThemeName,
        themeEmoji, setThemeEmoji,
        themeColor, setThemeColor,
        showTaskForm, showThemeForm, editingTaskId,
        handleToggleTaskForm, handleCancelTaskForm, handleToggleThemeForm,
        handleCreateTask, handleEditTask, handleUpdateTask, handleCreateTheme,
        toggleDone,
        deleteTask: handleDeleteTask,
        archiveTask: handleArchiveTask,
        permanentlyDeleteTask: handlePermanentlyDeleteTask,
        handleDeleteTheme,
    }
}