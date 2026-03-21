import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getHabits, createHabit, deleteHabit,
    logHabitSuccess, logHabitRelapse, undoHabitSuccess,
    getThemes
} from "./taskService"
import type { Habit, Theme } from "./taskService"

export function useHabitudes() {

    const navigate = useNavigate()

    const [habits, setHabits] = useState<Habit[]>([])
    const [themes, setThemes] = useState<Theme[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [relapseHabitId, setRelapseHabitId] = useState<number | null>(null)
    const [relapseNote, setRelapseNote] = useState("")
    const [successNote, setSuccessNote] = useState("")
    const [lastXp, setLastXp] = useState<{ id: number, xp: number } | null>(null)
    const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())

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
    const [timesPerDay, setTimesPerDay] = useState(1)
    const [startDate, setStartDate] = useState("")
    const [themeIds, setThemeIds] = useState<number[]>([])

    useEffect(() => {
        Promise.all([getHabits(), getThemes()])
            .then(([data, th]) => {
                setHabits(data)
                setThemes(th)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [])

    function toggleThemeSelection(id: number) {
        setThemeIds(prev => {
            if (prev.includes(id)) return prev.filter(t => t !== id)
            if (prev.length >= 3) return prev
            return [...prev, id]
        })
    }

    function resetForm() {
        setName(""); setType("build"); setCategory("other")
        setEmoji(""); setColor("#6366f1"); setFrequency("daily")
        setDifficulty("medium"); setIsPrivate(false); setMotivation("")
        setTriggers(""); setRelapsePlan(""); setDangerLevel("low")
        setTimesPerDay(1); setStartDate(""); setThemeIds([])
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
                start_date: type === "quit" ? startDate || undefined : undefined,
                theme_ids: themeIds
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
        if (loadingIds.has(id)) return
        setLoadingIds(prev => new Set(prev).add(id))
        try {
            const result = await logHabitSuccess(id, successNote || undefined)
            setHabits(prev => prev.map(h => {
                if (h.id !== id) return h
                return {
                    ...h,
                    todayCount: result.todayCount,
                    doneToday: result.isFullDay,
                    streak: result.isFullDay && !h.doneToday ? h.streak + 1 : h.streak,
                    totalSuccess: result.isFullDay && !h.doneToday ? h.totalSuccess + 1 : h.totalSuccess,
                    sparkCount: result.isSpark ? h.sparkCount + 1 : 0,
                }
            }))
            if (result.xpGained > 0) {
                setLastXp({ id, xp: result.xpGained })
                setTimeout(() => setLastXp(null), 3000)
            }
            setSuccessNote("")
        } catch (err: any) {
            if (err?.message?.includes("400")) {
                getHabits().then(data => setHabits(data))
            } else {
                console.error(err)
            }
        } finally {
            setLoadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
        }
    }

    async function handleUndo(id: number) {
        try {
            await undoHabitSuccess(id)
            setHabits(prev => prev.map(h => h.id === id ? {
                ...h, doneToday: false,
                todayCount: Math.max(0, h.todayCount - 1),
                streak: Math.max(0, h.streak - 1),
                totalSuccess: Math.max(0, h.totalSuccess - 1)
            } : h))
        } catch (err) { console.error(err) }
    }

    async function handleRelapse(id: number) {
        try {
            await logHabitRelapse(id, relapseNote || undefined)
            setHabits(prev => prev.map(h => h.id === id ? {
                ...h, streak: 0,
                relapseCount: h.relapseCount + 1,
                lastRelapse: new Date().toISOString()
            } : h))
            setRelapseHabitId(null)
            setRelapseNote("")
        } catch (err) { console.error(err) }
    }

    async function handleDelete(id: number) {
        try {
            await deleteHabit(id)
            setHabits(prev => prev.filter(h => h.id !== id))
        } catch (err) { console.error(err) }
    }

    const buildHabits = habits.filter(h => h.type === "build")
    const quitHabits = habits.filter(h => h.type === "quit")
    const MILESTONES = [7, 30, 90, 180, 365]

    function getNextMilestone(streak: number): number | null {
        return MILESTONES.find(m => m > streak) ?? null
    }

    function getDifficultyColor(d: string): string {
        if (d === "easy") return "#22c55e"
        if (d === "medium") return "#f59e0b"
        if (d === "hard") return "#ef4444"
        if (d === "extreme") return "#a855f7"
        return "#6366f1"
    }

    function getDangerColor(level: string): string {
        if (level === "low") return "#22c55e"
        if (level === "medium") return "#f59e0b"
        if (level === "high") return "#ef4444"
        return "#6366f1"
    }

    return {
        navigate, loading,
        habits, themes,
        buildHabits, quitHabits,
        showForm, setShowForm,
        relapseHabitId, setRelapseHabitId,
        relapseNote, setRelapseNote,
        successNote, setSuccessNote,
        timesPerDay, setTimesPerDay,
        startDate, setStartDate,
        themeIds, toggleThemeSelection,
        lastXp, loadingIds,
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
        handleSuccess, handleUndo,
        handleRelapse, handleDelete,
        getNextMilestone,
        getDifficultyColor, getDangerColor,
        MILESTONES,
    }
}