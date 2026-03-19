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

    useEffect(() => {
        Promise.all([
            getStatsOverview(),
            getTasksPerDay(period),
            getXpOverTime(period),
            getRadarData(),
            getPrioritySplit(),
            getFocusPerDay(period),
            getHeatmap()
        ])
            .then(([ov, tpd, xot, rd, ps, fpd, hm]) => {
                setOverview(ov)
                setTasksPerDay(tpd)
                setXpOverTime(xot)
                setRadarData(rd)
                setPrioritySplit(ps)
                setFocusPerDay(fpd)
                setHeatmap(hm)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [period])

    function formatHour(hour: number | null): string {
        if (hour === null) return "—"
        if (hour === 0) return "Minuit"
        if (hour < 12) return `${hour}h du matin`
        if (hour === 12) return "Midi"
        return `${hour}h`
    }

    function getHeatmapColor(count: number): string {
        if (count === 0) return "rgba(255,255,255,0.05)"
        if (count <= 2) return "rgba(99,102,241,0.3)"
        if (count <= 4) return "rgba(99,102,241,0.5)"
        if (count <= 6) return "rgba(99,102,241,0.7)"
        return "#6366f1"
    }

    function getHeatmapDays(): { date: string, count: number, dayOfWeek: number }[] {
        const heatmapMap: Record<string, number> = {}
        heatmap.forEach(h => { heatmapMap[h.date] = h.count })

        const now = new Date()
        let start: Date

        if (heatmapFrom) {
            start = new Date(heatmapFrom)
        } else if (heatmapPeriod === "week") {
            start = new Date()
            start.setDate(now.getDate() - 7)
        } else if (heatmapPeriod === "month") {
            start = new Date()
            start.setMonth(now.getMonth() - 1)
        } else if (heatmapPeriod === "3months") {
            start = new Date()
            start.setMonth(now.getMonth() - 3)
        } else if (heatmapPeriod === "6months") {
            start = new Date()
            start.setMonth(now.getMonth() - 6)
        } else if (heatmapPeriod === "all") {
            start = new Date("2024-01-01")
        } else {
            start = new Date()
            start.setDate(now.getDate() - 365)
        }

        const days: { date: string, count: number, dayOfWeek: number }[] = []
        const current = new Date(start)
        while (current <= now) {
            const key = current.toISOString().split("T")[0]
            days.push({
                date: key,
                count: heatmapMap[key] ?? 0,
                dayOfWeek: current.getDay()
            })
            current.setDate(current.getDate() + 1)
        }
        return days
    }

    return {
        navigate,
        loading,
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