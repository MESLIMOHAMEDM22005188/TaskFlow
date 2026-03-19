import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toggle, closeAll } from "./uiManager.ts"

import {
    getTasks,
    createTask,
    deleteTask as apiDeleteTask,
    completeTask,
    uncompleteTask,
    getTodayCompletions,
    getThemes,
    createTheme,
    deleteTheme as apiDeleteTheme,
    getNotifications
} from "../services/taskService"

import type { Task, Theme } from "./taskService.ts"


export function useDashboard() {

    const navigate = useNavigate()

    const [dark, setDark] = useState(true)

    const [tasks, setTasks] = useState<Task[]>([])
    const [themes, setThemes] = useState<Theme[]>([])
    const [doneTasks, setDoneTasks] = useState<number[]>([])
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [newTask, setNewTask] = useState("")
    const [priority, setPriority] = useState("Medium")
    const [themeId, setThemeId] = useState<number | null>(null)
    const [frequency, setFrequency] = useState("daily")
    const [deadline, setDeadline] = useState("")
    const [note, setNote] = useState("")

    const [themeName, setThemeName] = useState("")
    const [themeEmoji, setThemeEmoji] = useState("")
    const [themeColor, setThemeColor] = useState("#6366f1")

    const [showTaskForm, setShowTaskForm] = useState(false)
    const [showThemeForm, setShowThemeForm] = useState(false)

    // LOAD INITIAL DATA
    useEffect(() => {
        Promise.all([
            getTasks(),
            getThemes(),
            getTodayCompletions(),
            getNotifications()
        ])
            .then(([t, th, completions, notif]) => {
                setTasks(t)
                setThemes(th)
                setDoneTasks(completions)
                setNotifications(notif)
            })
            .catch(err => console.error("fetchAll error:", err))
    }, [])

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
                theme_id: themeId,
                frequency,
                deadline: deadline || null,
                note: note || null
            })

            setTasks(prev => [task, ...prev])

            // reset
            setNewTask("")
            setPriority("Medium")
            setThemeId(null)
            setFrequency("daily")
            setDeadline("")
            setNote("")

            closeAll(setShowTaskForm, setShowThemeForm)

        } catch (err) {
            console.error(err)
            alert("Failed to create task")
        }
    }

    async function handleCreateTheme() {
        if (!themeName.trim()) return

        try {
            const theme = await createTheme({
                name: themeName,
                emoji: themeEmoji || undefined,
                color: themeColor
            })

            setThemes(prev => [theme, ...prev])

            // reset
            setThemeName("")
            setThemeEmoji("")
            setThemeColor("#6366f1")

            closeAll(setShowTaskForm, setShowThemeForm)

        } catch (err) {
            console.error(err)
            alert("Failed to create theme")
        }
    }
    type Notification = {
        id: number
        message: string
        created_at: string
        read?: boolean
    }

    async function toggleDone(taskId: number) {
        try {
            if (doneTasks.includes(taskId)) {
                await uncompleteTask(taskId)
            } else {
                await completeTask(taskId)
            }

            // reload clean state
            const [t, completions] = await Promise.all([
                getTasks(),
                getTodayCompletions()
            ])

            setTasks(t)
            setDoneTasks(completions)

        } catch (err) {
            console.error(err)
        }
    }

    async function handleDeleteTask(taskId: number) {
        try {
            await apiDeleteTask(taskId)

            setTasks(prev => prev.filter(t => t.id !== taskId))
            setDoneTasks(prev => prev.filter(id => id !== taskId))

        } catch (err) {
            console.error(err)
        }
    }

    async function handleDeleteTheme(themeId: number) {
        try {
            await apiDeleteTheme(themeId)
            setThemes(prev => prev.filter(t => t.id !== themeId))
        } catch (err) {
            console.error(err)
        }
    }

    return {
        navigate,

        dark,
        setDark,

        tasks,
        themes,
        doneTasks,
        notifications,

        newTask,
        setNewTask,

        priority,
        setPriority,

        themeId,
        setThemeId,

        frequency,
        setFrequency,

        deadline,
        setDeadline,

        note,
        setNote,

        themeName,
        setThemeName,

        themeEmoji,
        setThemeEmoji,

        themeColor,
        setThemeColor,

        showTaskForm,
        showThemeForm,

        handleToggleTaskForm,
        handleToggleThemeForm,

        handleCreateTask,
        handleCreateTheme,

        toggleDone,
        deleteTask: handleDeleteTask,
        handleDeleteTheme,

    }
}