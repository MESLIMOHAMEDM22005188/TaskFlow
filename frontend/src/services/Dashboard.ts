import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toggle, closeAll } from "./uiManager.ts"
import {
    getTasks, createTask, deleteTask as apiDeleteTask,
    completeTask, uncompleteTask, getTodayCompletions,
    getThemes, createTheme, deleteTheme as apiDeleteTheme,
} from "../services/taskService"
import type { Task, Theme, TaskDailyState } from "../services/taskService.ts"

type Notification = { id: number; message: string; created_at: string; read?: boolean }

export function useDashboard() {

    const navigate = useNavigate()

    const [dark, setDark] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([])
    const [themes, setThemes] = useState<Theme[]>([])
    const [dailyState, setDailyState] = useState<Map<number, TaskDailyState>>(new Map())
    const [notifications] = useState<Notification[]>([])

    // Form task
    const [newTask, setNewTask] = useState("")
    const [priority, setPriority] = useState("Medium")
    const [themeIds, setThemeIds] = useState<number[]>([])
    const [frequency, setFrequency] = useState("daily")
    const [deadline, setDeadline] = useState("")
    const [note, setNote] = useState("")
    const [completionTarget, setCompletionTarget] = useState(1)

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
        Promise.all([getTasks(), getThemes(), getTodayCompletions()])
            .then(([t, th, completions]) => {
                setTasks(t)
                setThemes(th)
                setDailyState(buildDailyMap(completions))
            })
            .catch(err => console.error("fetchAll error:", err))
    }, [])

    function toggleThemeSelection(id: number) {
        setThemeIds(prev => {
            if (prev.includes(id)) return prev.filter(t => t !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    function handleToggleTaskForm() {
        setShowThemeForm(false)
        toggle(setShowTaskForm)
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
                deadline: deadline || null,
                note: note || null,
                completion_target: completionTarget
            })
            setTasks(prev => [task, ...prev])
            setNewTask("")
            setPriority("Medium")
            setThemeIds([])
            setFrequency("daily")
            setDeadline("")
            setNote("")
            setCompletionTarget(1)
            closeAll(setShowTaskForm, setShowThemeForm)
        } catch (err) {
            console.error(err)
            alert("Failed to create task")
        }
    }

    async function handleCreateTheme() {
        if (!themeName.trim()) return
        try {
            const theme = await createTheme({ name: themeName, emoji: themeEmoji || undefined, color: themeColor })
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
        try {
            const state = dailyState.get(taskId)
            const isDone = state?.done_today ?? false
            if (isDone) {
                const { task } = await uncompleteTask(taskId)
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...task } : t))
                setDailyState(prev => {
                    const next = new Map(prev)
                    const current = next.get(taskId)
                    if (current) next.set(taskId, { ...current, today_count: Math.max(0, current.today_count - 1), done_today: false })
                    return next
                })
            } else {
                const { task } = await completeTask(taskId)
                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...task } : t))
                setDailyState(prev => {
                    const next = new Map(prev)
                    const current = next.get(taskId) ?? { task_id: taskId, today_count: 0, done_today: false }
                    const newCount = current.today_count + 1
                    next.set(taskId, { ...current, today_count: newCount, done_today: newCount >= task.completion_target })
                    return next
                })
            }
        } catch (err) { console.error(err) }
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

    return {
        navigate,
        dark, setDark,
        tasks, themes, dailyState, notifications,
        newTask, setNewTask,
        priority, setPriority,
        themeIds, toggleThemeSelection,
        frequency, setFrequency,
        deadline, setDeadline,
        note, setNote,
        completionTarget, setCompletionTarget,
        themeName, setThemeName,
        themeEmoji, setThemeEmoji,
        themeColor, setThemeColor,
        showTaskForm, showThemeForm,
        handleToggleTaskForm, handleToggleThemeForm,
        handleCreateTask, handleCreateTheme,
        toggleDone,
        deleteTask: handleDeleteTask,
        archiveTask: handleArchiveTask,
        handleDeleteTheme,
    }
}