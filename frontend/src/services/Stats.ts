import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getStatsOverview, getTasksPerDay, getXpOverTime,
    getRadarData, getPrioritySplit, getFocusPerDay, getHeatmap
} from "./taskService"
import type {
    StatsOverview, TaskPerDay, XpOverTime,
    RadarData, PrioritySplit, FocusPerDay
} from "./taskService"

type Period = "week" | "month" | "year"
export type HeatmapPeriod = "week" | "month" | "3months" | "6months" | "365" | "all"

export function useStats() {

    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<Period>("week")
    const [heatmapPeriod, setHeatmapPeriod] = useState<HeatmapPeriod>("365")
    const [heatmapFrom, setHeatmapFrom] = useState("")

    const [overview, setOverview] = useState<StatsOverview>({
        totalTasks: 0,
        totalXp: 0,
        totalFocus: 0,
        bestStreak: 0,
        bestDay: "—",
        bestHour: null
    })

    const [tasksPerDay, setTasksPerDay] = useState<TaskPerDay[]>([])
    const [xpOverTime, setXpOverTime] = useState<XpOverTime[]>([])
    const [radarData, setRadarData] = useState<RadarData[]>([])
    const [prioritySplit, setPrioritySplit] = useState<PrioritySplit[]>([])
    const [focusPerDay, setFocusPerDay] = useState<FocusPerDay[]>([])
    const [heatmap, setHeatmap] = useState<TaskPerDay[]>([])

    const [hasLoadError, setHasLoadError] = useState(false)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setHasLoadError(false)

        const safeLoad = async <T,>(request: () => Promise<T>, fallback: T): Promise<T> => {
            try {
                return await request()
            } catch (err) {
                console.error("Stats request failed:", err)
                if (!cancelled) setHasLoadError(true)
                return fallback
            }
        }

        Promise.all([
            safeLoad(getStatsOverview, {
                totalTasks: 0, totalXp: 0, totalFocus: 0,
                bestStreak: 0, bestDay: "—", bestHour: null
            }),
            safeLoad(() => getTasksPerDay(period), [] as TaskPerDay[]),
            safeLoad(() => getXpOverTime(period), [] as XpOverTime[]),
            safeLoad(getRadarData, [] as RadarData[]),
            safeLoad(getPrioritySplit, [] as PrioritySplit[]),
            safeLoad(() => getFocusPerDay(period), [] as FocusPerDay[]),
            safeLoad(getHeatmap, [] as TaskPerDay[])
        ]).then(([ov, tpd, xot, rd, ps, fpd, hm]) => {
            if (cancelled) return
            setOverview({
                totalTasks: Number(ov.totalTasks) || 0,
                totalXp: Number(ov.totalXp) || 0,
                totalFocus: Number(ov.totalFocus) || 0,
                bestStreak: Number(ov.bestStreak) || 0,
                bestDay: ov.bestDay || "—",
                bestHour: ov.bestHour == null ? null : Number(ov.bestHour)
            })
            setTasksPerDay(tpd.map(item => ({ ...item, count: Number(item.count) || 0 })))
            setXpOverTime(xot.map(item => ({ ...item, xp: Number(item.xp) || 0 })))
            setRadarData(rd.map(item => ({
                ...item,
                tasks: Number(item.tasks) || 0,
                completed: Number(item.completed) || 0
            })))
            setPrioritySplit(ps.map(item => ({ ...item, count: Number(item.count) || 0 })))
            setFocusPerDay(fpd.map(item => ({ ...item, minutes: Number(item.minutes) || 0 })))
            setHeatmap(hm.map(item => ({ ...item, count: Number(item.count) || 0 })))
            setLoading(false)
        }).catch(err => {
            console.error("Unable to initialize statistics:", err)
            if (!cancelled) {
                setHasLoadError(true)
                setLoading(false)
            }
        })

        return () => { cancelled = true }
    }, [period])

    function formatHour(hour: number | null): string {
        if (hour === null) return "—"
        if (hour === 0) return "Minuit"
        if (hour < 12) return `${hour}h du matin`
        if (hour === 12) return "Midi"
        return `${hour}h`
    }

    function getHeatmapColor(count: number, baseColor = "#6366f1"): string {
        if (count <= 0) return "var(--stats-heatmap-empty, rgba(127,127,127,.09))"
        const safe = /^#[0-9a-f]{6}$/i.test(baseColor) ? baseColor : "#6366f1"
        const red = parseInt(safe.slice(1, 3), 16)
        const green = parseInt(safe.slice(3, 5), 16)
        const blue = parseInt(safe.slice(5, 7), 16)
        const opacity = count <= 2 ? 0.28 : count <= 4 ? 0.48 : count <= 6 ? 0.7 : 0.95
        return `rgba(${red}, ${green}, ${blue}, ${opacity})`
    }

    function getHeatmapDays(): { date: string, count: number, dayOfWeek: number }[] {
        const heatmapMap: Record<string, number> = {}
        heatmap.forEach(item => {
            const key = typeof item.date === "string" ? item.date.slice(0, 10) : String(item.date)
            heatmapMap[key] = Number(item.count) || 0
        })

        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const parseLocalDate = (value: string) => {
            const [year, month, day] = value.slice(0, 10).split("-").map(Number)
            return new Date(year, month - 1, day)
        }
        let start: Date

        if (heatmapFrom) {
            start = parseLocalDate(heatmapFrom)
        } else if (heatmapPeriod === "week") {
            start = new Date(now)
            start.setDate(start.getDate() - 6)
        } else if (heatmapPeriod === "month") {
            start = new Date(now)
            start.setDate(start.getDate() - 29)
        } else if (heatmapPeriod === "3months") {
            start = new Date(now)
            start.setMonth(start.getMonth() - 3)
        } else if (heatmapPeriod === "6months") {
            start = new Date(now)
            start.setMonth(start.getMonth() - 6)
        } else if (heatmapPeriod === "all") {
            const knownDates = Object.keys(heatmapMap).sort()
            start = knownDates.length ? parseLocalDate(knownDates[0]) : new Date(now)
            if (!knownDates.length) start.setDate(start.getDate() - 364)
        } else {
            start = new Date(now)
            start.setDate(start.getDate() - 364)
        }

        if (start > now) return []
        const days: { date: string, count: number, dayOfWeek: number }[] = []
        const current = new Date(start)
        current.setHours(0, 0, 0, 0)
        while (current <= now) {
            const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
            days.push({ date: key, count: heatmapMap[key] ?? 0, dayOfWeek: current.getDay() })
            current.setDate(current.getDate() + 1)
        }
        return days
    }

    return {
        navigate,
        loading,
        hasLoadError,
        period, setPeriod,
        heatmapPeriod, setHeatmapPeriod,
        heatmapFrom, setHeatmapFrom,
        overview,
        tasksPerDay,
        xpOverTime,
        radarData,
        prioritySplit,
        focusPerDay,
        getHeatmapDays,
        formatHour,
        getHeatmapColor,
    }
}