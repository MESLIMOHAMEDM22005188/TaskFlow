import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getHabits, createHabit, deleteHabit,
    logHabitSuccess, logHabitRelapse, undoHabitSuccess
} from "./taskService"
import type { Habit } from "./taskService"

export function useHabitudes() {

    const navigate = useNavigate()

    const [habits, setHabits] = useState<Habit[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [relapseHabitId, setRelapseHabitId] = useState<number | null>(null)
    const [relapseNote, setRelapseNote] = useState("")
    const [successNote, setSuccessNote] = useState("")
    const [lastXp, setLastXp] = useState<{ id: number, xp: number } | null>(null)

    const [name, setName] = useState("")
    const [type, setType] = useState<"build" | "quit">("build")
    const [category, setCategory] = useState("other")
    const [emoji, setEmoji] = useState("")
    const [color, setColor] = useState("#6366f1")
    const [frequency, setFrequency] = useState("daily")
    const [difficulty, setDifficulty] = useState("medium")
    const [isPrivate, setIsPrivate] = useState(false)
    const [motivation, setMotivation] = useState("")
    const [triggers, setTriggers] = useState("")
    const [relapsePlan, setRelapsePlan] = useState("")
    const [dangerLevel, setDangerLevel] = useState("low")
    const [timesPerDay, setTimesPerDay] = useState(1)   // ✅ en haut
    const [startDate, setStartDate] = useState("")       // ✅ en haut

    useEffect(() => {
        getHabits()
            .then(data => {
                setHabits(data)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [])

    function resetForm() {
        setName("")
        setType("build")
        setCategory("other")
        setEmoji("")
        setColor("#6366f1")
        setFrequency("daily")
        setDifficulty("medium")
        setIsPrivate(false)
        setMotivation("")
        setTriggers("")
        setRelapsePlan("")
        setDangerLevel("low")
        setTimesPerDay(1)   // ✅
        setStartDate("")    // ✅
    }

    async function handleCreateHabit() {
        if (!name.trim()) return
        try {
            const habit = await createHabit({
                name, type, category,
                emoji: emoji || undefined,
                color, frequency, difficulty,
                is_private: isPrivate,
                motivation: motivation || undefined,
                triggers: type === "quit" ? triggers || undefined : undefined,
                relapse_plan: type === "quit" ? relapsePlan || undefined : undefined,
                danger_level: type === "quit" ? dangerLevel : "low",
                times_per_day: timesPerDay,
                start_date: type === "quit" ? startDate || undefined : undefined
            })
            setHabits(prev => [habit, ...prev])
            resetForm()
            setShowForm(false)
        } catch (err) {
            console.error(err)
            alert("Failed to create habit")
        }
    }

    async function handleSuccess(id: number) {
        try {
            const result = await logHabitSuccess(id, successNote || undefined)
            setHabits(prev => prev.map(h => h.id === id ? {
                ...h,
                todayCount: result.todayCount,
                doneToday: result.isFullDay,
                streak: result.isFullDay ? h.streak + 1 : h.streak,
                totalSuccess: result.isFullDay ? h.totalSuccess + 1 : h.totalSuccess,
                sparkCount: result.isSpark ? h.sparkCount + 1 : 0
            } : h))
            if (result.xpGained > 0) {
                setLastXp({ id, xp: result.xpGained })
                setTimeout(() => setLastXp(null), 3000)
            }
            setSuccessNote("")
        } catch (err) {
            console.error(err)
        }
    }

    async function handleUndo(id: number) {
        try {
            await undoHabitSuccess(id)
            setHabits(prev => prev.map(h => h.id === id ? {
                ...h,
                doneToday: false,
                todayCount: Math.max(0, h.todayCount - 1),
                streak: Math.max(0, h.streak - 1),
                totalSuccess: Math.max(0, h.totalSuccess - 1)
            } : h))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleRelapse(id: number) {
        try {
            await logHabitRelapse(id, relapseNote || undefined)
            setHabits(prev => prev.map(h => h.id === id ? {
                ...h,
                streak: 0,
                relapseCount: h.relapseCount + 1,
                lastRelapse: new Date().toISOString()
            } : h))
            setRelapseHabitId(null)
            setRelapseNote("")
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteHabit(id)
            setHabits(prev => prev.filter(h => h.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const buildHabits = habits.filter(h => h.type === "build")
    const quitHabits = habits.filter(h => h.type === "quit")
    const MILESTONES = [7, 30, 90, 180, 365]

    function getNextMilestone(streak: number): number | null {
        return MILESTONES.find(m => m > streak) ?? null
    }

    function getDifficultyColor(difficulty: string): string {
        if (difficulty === "easy") return "#22c55e"
        if (difficulty === "medium") return "#f59e0b"
        if (difficulty === "hard") return "#ef4444"
        if (difficulty === "extreme") return "#a855f7"
        return "#6366f1"
    }

    function getDangerColor(level: string): string {
        if (level === "low") return "#22c55e"
        if (level === "medium") return "#f59e0b"
        if (level === "high") return "#ef4444"
        return "#6366f1"
    }

    return {
        navigate,
        loading,
        habits,
        buildHabits,
        quitHabits,
        showForm, setShowForm,
        relapseHabitId, setRelapseHabitId,
        relapseNote, setRelapseNote,
        successNote, setSuccessNote,
        timesPerDay, setTimesPerDay,
        startDate, setStartDate,
        lastXp,
        name, setName,
        type, setType,
        category, setCategory,
        emoji, setEmoji,
        color, setColor,
        frequency, setFrequency,
        difficulty, setDifficulty,
        isPrivate, setIsPrivate,
        motivation, setMotivation,
        triggers, setTriggers,
        relapsePlan, setRelapsePlan,
        dangerLevel, setDangerLevel,
        handleCreateHabit,
        handleSuccess,
        handleUndo,
        handleRelapse,
        handleDelete,
        getNextMilestone,
        getDifficultyColor,
        getDangerColor,
        MILESTONES,
    }
}