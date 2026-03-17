import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createTask, getTasks } from "../services/taskService"
import type { Task } from "../services/taskService"
import { toggle, closeAll } from "../services/uiManager"

export function useDashboard() {

    const navigate = useNavigate()

    const [dark, setDark] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([])
    const [newTask, setNewTask] = useState("")
    const [priority, setPriority] = useState("Medium")
    const [showTaskForm, setShowTaskForm] = useState(false)
    const [showThemeForm, setShowThemeForm] = useState(false)
    const [doneTasks, setDoneTasks] = useState<number[]>([]) // ✅ number[] et non string[]

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await getTasks()
                setTasks(data)
            } catch (err) {
                console.error(err)
            }
        }
        fetchTasks()
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
            const task = await createTask({ title: newTask, priority })
            setTasks([...tasks, task])
            setNewTask("")
            setPriority("Medium")
            closeAll(setShowTaskForm, setShowThemeForm)
        } catch (err) {
            console.error(err)
            alert("Failed to create task")
        }
    }

    function toggleDone(taskId: number) {
        setDoneTasks(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        )
    }

    function deleteTask(taskId: number) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        setDoneTasks(prev => prev.filter(id => id !== taskId))
    }

    return {
        navigate,
        dark, setDark,
        tasks,
        newTask, setNewTask,
        priority, setPriority,
        showTaskForm,
        showThemeForm,
        handleToggleTaskForm,
        handleToggleThemeForm,
        handleCreateTask,
        toggle,
        doneTasks,
        toggleDone,
        deleteTask,
    }
}