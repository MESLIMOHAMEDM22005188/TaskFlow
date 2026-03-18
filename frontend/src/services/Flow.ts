import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
    getFlowSettings, updateFlowSettings,
    saveFlowSession, getFlowStats,
    getTasks
} from "./taskService"
import type { FlowSettings, FlowStats, Task } from "./taskService"

type TimerMode = "focus" | "short_break" | "long_break"

export function useFlow() {

    const navigate = useNavigate()

    const [settings, setSettings] = useState<FlowSettings | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    const [mode, setMode] = useState<TimerMode>("focus")
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)
    const [pomodoroCount, setPomodoroCount] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTimeRef = useRef<number>(0)

    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

    const [stats, setStats] = useState<FlowStats>({
        todaySessions: 0,
        todayMinutes: 0,
        totalSessions: 0,
        totalMinutes: 0
    })

    const [ambientSound, setAmbientSound] = useState("none")
    const [ambientVolume, setAmbientVolume] = useState(50)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const [lastXp, setLastXp] = useState<number | null>(null)

    useEffect(() => {
        Promise.all([getFlowSettings(), getFlowStats(), getTasks()])
            .then(([s, st, t]) => {
                setSettings(s)
                setTimeLeft(s.focus_duration * 60)
                setAmbientSound(s.ambient_sound)
                setAmbientVolume(s.ambient_volume)
                setStats(st)
                setTasks(t)
            })
            .catch(err => console.error(err))
    }, [])

    useEffect(() => {
        if (isRunning) {
            startTimeRef.current = Date.now()
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // eslint-disable-next-line react-hooks/immutability
                        handleTimerEnd()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isRunning, mode])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        if (ambientSound !== "none" && isRunning) {
            const sounds: Record<string, string> = {
                rain: "https://www.fesliyanstudios.com/play-mp3/387",
                heavy_rain: "https://www.fesliyanstudios.com/play-mp3/388",
                forest: "https://www.fesliyanstudios.com/play-mp3/390",
                waves: "https://www.fesliyanstudios.com/play-mp3/391",
                fire: "https://www.fesliyanstudios.com/play-mp3/392",
                cafe: "https://www.fesliyanstudios.com/play-mp3/393",
                wind: "https://www.fesliyanstudios.com/play-mp3/394",
                night: "https://www.fesliyanstudios.com/play-mp3/395",
                river: "https://www.fesliyanstudios.com/play-mp3/396",
                lofi: "https://www.fesliyanstudios.com/play-mp3/2400",
            }
            if (sounds[ambientSound]) {
                audioRef.current = new Audio(sounds[ambientSound])
                audioRef.current.loop = true
                audioRef.current.volume = ambientVolume / 100
                audioRef.current.play().catch(err => console.error(err))
            }
        }
    }, [ambientSound, isRunning])

    async function handleTimerEnd() {
        setIsRunning(false)

        const minutesSpent = settings
            ? mode === "focus" ? settings.focus_duration
                : mode === "short_break" ? settings.short_break
                    : settings.long_break
            : 25

        const result = await saveFlowSession({
            task_id: selectedTaskId,
            duration_minutes: minutesSpent,
            type: mode,
            completed: true
        })

        if (result.xpGained > 0) setLastXp(result.xpGained)

        const newStats = await getFlowStats()
        setStats(newStats)

        if (mode === "focus") {
            const newCount = pomodoroCount + 1
            setPomodoroCount(newCount)

            const isLongBreak = newCount % (settings?.pomodoros_until_long ?? 4) === 0
            switchMode(isLongBreak ? "long_break" : "short_break")

            if (settings?.auto_start_break) setIsRunning(true)
        } else {
            switchMode("focus")
            if (settings?.auto_start_break) setIsRunning(true)
        }
    }

    function switchMode(newMode: TimerMode) {
        setMode(newMode)
        if (!settings) return
        if (newMode === "focus") setTimeLeft(settings.focus_duration * 60)
        else if (newMode === "short_break") setTimeLeft(settings.short_break * 60)
        else setTimeLeft(settings.long_break * 60)
    }

    function handleStart() {
        setIsRunning(true)
        setLastXp(null)
    }

    function handlePause() {
        setIsRunning(false)
    }

    function handleReset() {
        setIsRunning(false)
        switchMode(mode)
        setLastXp(null)
    }

    function handleSkip() {
        setIsRunning(false)
        if (mode === "focus") {
            const newCount = pomodoroCount + 1
            setPomodoroCount(newCount)
            const isLongBreak = newCount % (settings?.pomodoros_until_long ?? 4) === 0
            switchMode(isLongBreak ? "long_break" : "short_break")
        } else {
            switchMode("focus")
        }
    }

    async function handleSaveSettings(newSettings: Partial<FlowSettings>) {
        const updated = await updateFlowSettings(newSettings)
        setSettings(updated)
        setAmbientSound(updated.ambient_sound)
        setAmbientVolume(updated.ambient_volume)
        switchMode(mode)
        setShowSettings(false)
    }

    const totalTime = settings
        ? mode === "focus" ? settings.focus_duration * 60
            : mode === "short_break" ? settings.short_break * 60
                : settings.long_break * 60
        : 25 * 60

    const progressPercent = ((totalTime - timeLeft) / totalTime) * 100
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0")
    const seconds = (timeLeft % 60).toString().padStart(2, "0")

    return {
        navigate,
        settings,
        showSettings, setShowSettings,
        mode, switchMode,
        timeLeft,
        isRunning,
        pomodoroCount,
        minutes, seconds,
        progressPercent,
        tasks,
        selectedTaskId, setSelectedTaskId,
        stats,
        ambientSound, setAmbientSound,
        ambientVolume, setAmbientVolume,
        lastXp,
        handleStart,
        handlePause,
        handleReset,
        handleSkip,
        handleSaveSettings,
    }
}