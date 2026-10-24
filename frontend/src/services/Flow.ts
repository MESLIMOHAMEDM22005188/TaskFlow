import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"

import {
    getFlowSettings,
    updateFlowSettings,
    saveFlowSession,
    getFlowStats,
    getTasks
} from "./taskService"


import type {
    FlowSettings,
    FlowStats,
    Task
} from "./taskService"
import { createAmbientAudioController } from "./ambientAudio"
import type { AmbientAudioController } from "./ambientAudio"

type TimerMode = "focus" | "short_break" | "long_break"

function useFlow() {

    const navigate = useNavigate()

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const ambientAudioRef = useRef<AmbientAudioController | null>(null)

    const [settings, setSettings] = useState<FlowSettings | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    const [mode, setMode] = useState<TimerMode>("focus")
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isRunning, setIsRunning] = useState(false)

    const [pomodoroCount, setPomodoroCount] = useState(0)

    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)

    const [stats, setStats] = useState<FlowStats>({
        todaySessions: 0,
        todayMinutes: 0,
        totalSessions: 0,
        totalMinutes: 0
    })

    const [ambientSound, setAmbientSoundState] = useState("none")
    const [ambientVolume, setAmbientVolume] = useState(50)

    const setAmbientSound = useCallback((sound: string) => {
        setAmbientSoundState(sound)
        if (!ambientAudioRef.current) ambientAudioRef.current = createAmbientAudioController()
        ambientAudioRef.current.play(sound, ambientVolume)
    }, [ambientVolume])

    const [lastXp, setLastXp] = useState<number | null>(null)

    useEffect(() => {

        async function load() {
            try {

                const [flowSettings, flowStats, userTasks] = await Promise.all([
                    getFlowSettings(),
                    getFlowStats(),
                    getTasks()
                ])

                setSettings(flowSettings)
                setStats(flowStats)
                setTasks(userTasks)

                setAmbientSoundState(flowSettings.ambient_sound)
                setAmbientVolume(flowSettings.ambient_volume)

                setTimeLeft(flowSettings.focus_duration * 60)

            } catch (err) {
                console.error(err)
            }
        }

        load()

    }, [])

    const switchMode = useCallback((newMode: TimerMode) => {
        setIsRunning(false)

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }

        setMode(newMode)

        // Switching modes must work even while preferences are still loading or unavailable.
        const durations = settings ?? {
            focus_duration: 25,
            short_break: 5,
            long_break: 15,
        }
        const duration = newMode === "focus"
            ? durations.focus_duration
            : newMode === "short_break"
                ? durations.short_break
                : durations.long_break
        setTimeLeft(Math.max(1, duration) * 60)
    }, [settings])
    const handleTimerEnd = useCallback(async () => {
        setIsRunning(false)

        const minutesSpent = settings
            ? mode === "focus"
                ? settings.focus_duration
                : mode === "short_break"
                    ? settings.short_break
                    : settings.long_break
            : 25

        const result = await saveFlowSession({
            task_id: selectedTaskId,
            duration_minutes: minutesSpent,
            type: mode,
            completed: true
        })

        if (result.xpGained > 0) {
            setLastXp(result.xpGained)
        }

        const newStats = await getFlowStats()
        setStats(newStats)

        if (mode === "focus") {

            const newCount = pomodoroCount + 1
            setPomodoroCount(newCount)

            const isLongBreak =
                newCount % (settings?.pomodoros_until_long ?? 4) === 0

            switchMode(isLongBreak ? "long_break" : "short_break")

            if (settings?.auto_start_break) {
                setIsRunning(true)
            }

        } else {

            switchMode("focus")

            if (settings?.auto_start_break) {
                setIsRunning(true)
            }
        }

    }, [
        mode,
        pomodoroCount,
        selectedTaskId,
        settings,
        switchMode
    ])

    useEffect(() => {

        if (!isRunning) {

            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }

            return
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {

            setTimeLeft(previous => {

                if (previous <= 1) {

                    clearInterval(intervalRef.current!)
                    intervalRef.current = null

                    setTimeout(() => {
                        handleTimerEnd()
                    }, 0)

                    return 0
                }

                return previous - 1
            })

        }, 1000)

        return () => {

            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }

        }

    }, [isRunning, handleTimerEnd])

    // The selected ambience is generated locally; sound buttons preview it immediately.
    useEffect(() => {
        if (!ambientAudioRef.current) return
        ambientAudioRef.current.setVolume(ambientVolume)
    }, [ambientVolume])

    useEffect(() => () => {
        ambientAudioRef.current?.dispose()
        ambientAudioRef.current = null
    }, [])


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

    async function handleSaveSettings(newSettings: Partial<FlowSettings>, nextMode: TimerMode = mode) {
        const defaults: FlowSettings = {
            id: 0,
            user_id: 0,
            focus_duration: 25,
            short_break: 5,
            long_break: 15,
            pomodoros_until_long: 4,
            auto_start_break: false,
            ambient_sound: "none",
            ambient_volume: 50,
        }
        const optimistic = { ...defaults, ...(settings ?? {}), ...newSettings }

        // Update the UI first so changing a method or a break always responds to the click.
        setIsRunning(false)
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setSettings(optimistic)
        setMode(nextMode)
        setAmbientSoundState(optimistic.ambient_sound)
        setAmbientVolume(optimistic.ambient_volume)
        const currentDuration = nextMode === "focus"
            ? optimistic.focus_duration
            : nextMode === "short_break" ? optimistic.short_break : optimistic.long_break
        setTimeLeft(Math.max(1, currentDuration) * 60)

        const updated = await updateFlowSettings(newSettings)
        const merged: FlowSettings = { ...optimistic, ...updated, ...newSettings }
        setSettings(merged)
        setAmbientSoundState(merged.ambient_sound)
        setAmbientVolume(merged.ambient_volume)
        setMode(nextMode)
        const updatedDuration = nextMode === "focus"
            ? merged.focus_duration
            : nextMode === "short_break" ? merged.short_break : merged.long_break
        setTimeLeft(Math.max(1, updatedDuration) * 60)
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

export default useFlow
