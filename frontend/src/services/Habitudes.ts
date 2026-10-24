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
    const [actionError, setActionError] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)

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
        let cancelled = false
        Promise.allSettled([getHabits(), getThemes()]).then(([habitsResult, themesResult]) => {
            if (cancelled) return
            if (habitsResult.status === "fulfilled") setHabits(habitsResult.value)
            else {
                console.error("Impossible de charger les habitudes :", habitsResult.reason)
                setActionError("Impossible de charger les habitudes. Actualise la page ou reconnecte-toi.")
            }
            if (themesResult.status === "fulfilled") setThemes(themesResult.value)
            else console.error("Impossible de charger les thèmes :", themesResult.reason)
            setLoading(false)
        })
        return () => { cancelled = true }
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
        const cleanedName = name.trim()
        if (!cleanedName || isCreating) return null
        setIsCreating(true)
        setActionError(null)
        try {
            const habit = await createHabit({
                name: cleanedName, type, category,
                emoji: emoji || undefined,
                color, frequency, difficulty,
                is_private: isPrivate,
                motivation: motivation || undefined,
                triggers: type === "quit" ? triggers || undefined : undefined,
                relapse_plan: type === "quit" ? relapsePlan || undefined : undefined,
                danger_level: type === "quit" ? dangerLevel : "low",
                times_per_day: Math.max(1, Math.min(20, Math.floor(Number(timesPerDay) || 1))),
                start_date: type === "quit" ? startDate || undefined : undefined,
                theme_ids: themeIds
            })
            setHabits(prev => [habit, ...prev])
            resetForm()
            setShowForm(false)
            return habit
        } catch (err) {
            console.error("Impossible de créer l’habitude :", err)
            setActionError("L’habitude n’a pas pu être créée. Vérifie ta connexion puis réessaie.")
            return null
        } finally {
            setIsCreating(false)
        }
    }

    async function handleSuccess(id: number) {
        if (loadingIds.has(id)) return
        setLoadingIds(prev => new Set(prev).add(id))
        setActionError(null)
        try {
            const result = await logHabitSuccess(id, successNote || undefined)
            setHabits(prev => prev.map(h => {
                if (h.id !== id) return h
                return {
                    ...h,
                    todayCount: Number(result.todayCount) || 0,
                    doneToday: Boolean(result.isFullDay),
                    streak: result.isFullDay && !h.doneToday ? Number(h.streak || 0) + 1 : h.streak,
                    totalSuccess: result.isFullDay && !h.doneToday ? Number(h.totalSuccess || 0) + 1 : h.totalSuccess,
                    sparkCount: result.isSpark ? Number(h.sparkCount || 0) + 1 : 0,
                }
            }))
            if (result.xpGained > 0) {
                setLastXp({ id, xp: result.xpGained })
                setTimeout(() => setLastXp(null), 3000)
            }
            setSuccessNote("")
        } catch (err: any) {
            console.error("Impossible d’enregistrer l’habitude :", err)
            try {
                const freshHabits = await getHabits()
                setHabits(freshHabits)
            } catch (refreshError) {
                console.error(refreshError)
            }
            setActionError(err?.message?.includes("400")
                ? "Cette action a déjà été enregistrée ou la limite du jour est atteinte."
                : "Impossible d’enregistrer cette habitude. Réessaie.")
        } finally {
            setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
        }
    }

    async function handleUndo(id: number) {
        if (loadingIds.has(id)) return
        setLoadingIds(prev => new Set(prev).add(id))
        setActionError(null)
        try {
            await undoHabitSuccess(id)
            // Recharger les valeurs calculées par le serveur : les streaks ne baissent
            // pas forcément d'un jour quand une habitude se fait plusieurs fois par jour.
            const freshHabits = await getHabits()
            setHabits(freshHabits)
        } catch (err) {
            console.error("Impossible d’annuler cette validation :", err)
            setActionError("Impossible d’annuler cette validation. Réessaie.")
        } finally {
            setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
        }
    }

    async function handleRelapse(id: number) {
        if (loadingIds.has(id)) return
        setLoadingIds(prev => new Set(prev).add(id))
        setActionError(null)
        try {
            await logHabitRelapse(id, relapseNote || undefined)
            setHabits(prev => prev.map(h => h.id === id ? {
                ...h, streak: 0,
                relapseCount: Number(h.relapseCount || 0) + 1,
                lastRelapse: new Date().toISOString(),
                sparkCount: 0
            } : h))
            setRelapseHabitId(null)
            setRelapseNote("")
            getHabits().then(freshHabits => setHabits(freshHabits)).catch(console.error)
        } catch (err) {
            console.error("Impossible d’enregistrer cette rechute :", err)
            setActionError("La rechute n’a pas pu être enregistrée. Réessaie.")
        } finally {
            setLoadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
        }
    }

    async function handleDelete(id: number) {
        setActionError(null)
        try {
            await deleteHabit(id)
            setHabits(prev => prev.filter(h => h.id !== id))
        } catch (err) {
            console.error("Impossible de supprimer l’habitude :", err)
            setActionError("L’habitude n’a pas pu être supprimée. Réessaie.")
        }
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
        lastXp, loadingIds, actionError, isCreating,
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
