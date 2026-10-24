import { useState } from "react"
import "../assets/css/flow.css"
import useFlow from "../services/Flow"
import Navbar from "../components/Navbar"

const FOCUS_METHODS = [
    { label: "Pomodoro", emoji: "🍅", description: "Équilibre classique", focus: 25, short: 5, long: 15 },
    { label: "52 / 17", emoji: "⚡", description: "Concentration soutenue", focus: 52, short: 17, long: 17 },
    { label: "Deep Work", emoji: "🧠", description: "Travail en profondeur", focus: 90, short: 20, long: 20 },
    { label: "Timebox", emoji: "🎯", description: "Un objectif à la fois", focus: 45, short: 10, long: 15 },
    { label: "Flow State", emoji: "🌊", description: "Session immersive", focus: 120, short: 30, long: 30 },
    { label: "52 / 17 Ultra", emoji: "🚀", description: "Longue session", focus: 52, short: 17, long: 30 },
    { label: "90 / 20", emoji: "⏱️", description: "Cycle ultradien", focus: 90, short: 20, long: 20 },
    { label: "Lecture", emoji: "📚", description: "Étude et révision", focus: 30, short: 5, long: 15 },
]

const AMBIENT_SOUNDS = [
    { value: "none", emoji: "🔇", label: "Silence" },
    { value: "rain", emoji: "🌧️", label: "Pluie" },
    { value: "heavy_rain", emoji: "⛈️", label: "Orage" },
    { value: "forest", emoji: "🌲", label: "Forêt" },
    { value: "waves", emoji: "🌊", label: "Océan" },
    { value: "fire", emoji: "🔥", label: "Feu de camp" },
    { value: "cafe", emoji: "☕", label: "Café" },
    { value: "wind", emoji: "💨", label: "Vent" },
    { value: "night", emoji: "🌙", label: "Nuit" },
    { value: "river", emoji: "🏞️", label: "Rivière" },
    { value: "lofi", emoji: "🎵", label: "Lofi" },
]

const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours === 0) return remainingMinutes + " min"
    if (remainingMinutes === 0) return hours + " h"
    return hours + " h " + remainingMinutes + " min"
}

export default function Flow() {
    const {
        settings, showSettings, setShowSettings, mode, switchMode, isRunning,
        pomodoroCount, minutes, seconds, progressPercent, tasks, selectedTaskId,
        setSelectedTaskId, stats, ambientSound, setAmbientSound, ambientVolume,
        setAmbientVolume, lastXp, handleStart, handlePause, handleReset, handleSkip,
        handleSaveSettings,
    } = useFlow()

    const [settingsError, setSettingsError] = useState("")
    const [settingsSaved, setSettingsSaved] = useState(false)
    const selectedTask = tasks.find(task => task.id === selectedTaskId)
    const cycleLength = Math.max(1, settings?.pomodoros_until_long ?? 4)
    const completedInCycle = pomodoroCount % cycleLength
    const progress = Math.max(0, Math.min(100, progressPercent))
    const activeModeLabel = mode === "focus" ? "Concentration" : mode === "short_break" ? "Pause courte" : "Pause longue"
    const activeModeDescription = mode === "focus"
        ? "Une seule tâche. Une chose à la fois."
        : mode === "short_break" ? "Lève-toi, respire et détends tes yeux." : "Éloigne-toi de l’écran et recharge ton énergie."

    const isMethodSelected = (method: typeof FOCUS_METHODS[number]) =>
        settings?.focus_duration === method.focus &&
        settings?.short_break === method.short &&
        settings?.long_break === method.long

    async function saveTimerSettings() {
        const focus = Number((document.getElementById("flow-focus-duration") as HTMLInputElement | null)?.value)
        const shortBreak = Number((document.getElementById("flow-short-break") as HTMLInputElement | null)?.value)
        const longBreak = Number((document.getElementById("flow-long-break") as HTMLInputElement | null)?.value)
        const cycles = Number((document.getElementById("flow-pomodoros-until-long") as HTMLInputElement | null)?.value)
        const autoStart = (document.getElementById("flow-auto-start-break") as HTMLSelectElement | null)?.value === "true"

        if (!Number.isInteger(focus) || focus < 1 || focus > 180) {
            setSettingsError("La durée de concentration doit être comprise entre 1 et 180 minutes.")
            setSettingsSaved(false)
            return
        }
        if (!Number.isInteger(shortBreak) || shortBreak < 1 || shortBreak > 60 || !Number.isInteger(longBreak) || longBreak < 1 || longBreak > 60) {
            setSettingsError("Les pauses doivent être comprises entre 1 et 60 minutes.")
            setSettingsSaved(false)
            return
        }
        if (!Number.isInteger(cycles) || cycles < 2 || cycles > 12) {
            setSettingsError("Choisis entre 2 et 12 sessions avant la pause longue.")
            setSettingsSaved(false)
            return
        }

        try {
            setSettingsError("")
            await handleSaveSettings({
                focus_duration: focus,
                short_break: shortBreak,
                long_break: longBreak,
                pomodoros_until_long: cycles,
                auto_start_break: autoStart,
                ambient_sound: ambientSound,
                ambient_volume: ambientVolume,
            })
            setSettingsSaved(true)
            window.setTimeout(() => setSettingsSaved(false), 3000)
        } catch {
            setSettingsError("Impossible d’enregistrer les paramètres. Vérifie ta connexion et réessaie.")
            setSettingsSaved(false)
        }
    }

    return (
        <div className="flow-page">
            <Navbar />
            <main className="flow-main">
                <header className="flow-header">
                    <div>
                        <p className="flow-eyebrow">TON ESPACE DE CONCENTRATION</p>
                        <h1 className="flow-title">Entre dans ton <span>flow.</span></h1>
                        <p className="flow-intro">Avance sur l’essentiel, à ton rythme. Le reste peut attendre.</p>
                    </div>
                    <div className={"flow-session-status" + (isRunning ? " is-running" : "")}>
                        <span className="flow-status-indicator" />
                        {isRunning ? "Session en cours" : "Prêt à commencer"}
                    </div>
                </header>

                <div className="flow-layout">
                    <div className="flow-main-column">
                        <section className="flow-card flow-timer-card" aria-label="Minuteur de concentration">
                            <div className="flow-card-topline">
                                <div>
                                    <p className="flow-overline">SESSION ACTUELLE</p>
                                    <h2 className="flow-card-title">{activeModeLabel}</h2>
                                </div>
                                <span className="flow-mode-chip">{mode === "focus" ? "FOCUS" : mode === "short_break" ? "PAUSE · S" : "PAUSE · L"}</span>
                            </div>

                            <div className="flow-modes" role="group" aria-label="Type de session">
                                <button type="button" className={"flow-mode-btn" + (mode === "focus" ? " active" : "")} aria-pressed={mode === "focus"} onClick={() => switchMode("focus")}>Concentration</button>
                                <button type="button" className={"flow-mode-btn" + (mode === "short_break" ? " active" : "")} aria-pressed={mode === "short_break"} onClick={() => switchMode("short_break")}>Pause courte</button>
                                <button type="button" className={"flow-mode-btn" + (mode === "long_break" ? " active" : "")} aria-pressed={mode === "long_break"} onClick={() => switchMode("long_break")}>Pause longue</button>
                            </div>

                            <div className="flow-timer-wrapper">
                                <svg className="flow-progress-ring" viewBox="0 0 220 220" aria-hidden="true">
                                    <circle cx="110" cy="110" r="98" className="ring-bg" />
                                    <circle cx="110" cy="110" r="98" className="ring-fill" strokeDasharray={String(2 * Math.PI * 98)} strokeDashoffset={String(2 * Math.PI * 98 * (1 - progress / 100))} />
                                </svg>
                                <div className="flow-timer-display" role="timer" aria-label={minutes + " minutes et " + seconds + " secondes restantes"}>
                                    <span className="flow-time">{minutes}<span className="flow-time-colon">:</span>{seconds}</span>
                                    <span className="flow-time-caption">{isRunning ? "Reste dans ta zone" : "Temps restant"}</span>
                                </div>
                            </div>

                            <p className="flow-mode-description">{activeModeDescription}</p>

                            {lastXp !== null && lastXp > 0 && (
                                <div className="flow-xp-badge" role="status">+{lastXp} XP <span>Session terminée, bien joué !</span></div>
                            )}

                            <div className="flow-controls">
                                <button type="button" className="flow-btn secondary" onClick={handleReset} aria-label="Réinitialiser le minuteur" title="Réinitialiser">↺</button>
                                <button type="button" className="flow-btn primary" onClick={isRunning ? handlePause : handleStart} aria-label={isRunning ? "Mettre en pause" : "Démarrer le minuteur"} title={isRunning ? "Mettre en pause" : "Démarrer"}>
                                    {isRunning ? <span aria-hidden="true">Ⅱ</span> : <span className="flow-play-icon" aria-hidden="true">▶</span>}
                                    <span className="flow-primary-label">{isRunning ? "Pause" : "Démarrer"}</span>
                                </button>
                                <button type="button" className="flow-btn secondary" onClick={handleSkip} aria-label="Passer à l’étape suivante" title="Passer à l’étape suivante">→</button>
                            </div>

                            <div className="flow-cycle">
                                <div className="flow-cycle-dots" aria-label={completedInCycle + " session(s) sur " + cycleLength + " terminée(s) dans ce cycle"}>
                                    {Array.from({ length: cycleLength }).map((_, index) => <span key={index} className={"pomodoro-dot" + (index < completedInCycle ? " done" : "")} />)}
                                </div>
                                <span className="flow-cycle-caption">Cycle {completedInCycle + 1} sur {cycleLength} avant la pause longue</span>
                            </div>
                        </section>

                        <section className="flow-card flow-methods">
                            <div className="flow-section-heading">
                                <div>
                                    <p className="flow-overline">À TOI DE CHOISIR</p>
                                    <h2 className="flow-card-title">Méthode de travail</h2>
                                </div>
                                <span className="flow-section-count">{FOCUS_METHODS.length} méthodes</span>
                            </div>
                            <div className="flow-method-buttons">
                                {FOCUS_METHODS.map(method => (
                                    <button
                                        type="button"
                                        key={method.label}
                                        className={"flow-method-btn" + (isMethodSelected(method) ? " active" : "")}
                                        aria-pressed={isMethodSelected(method)}
                                        onClick={() => {
                                            setSettingsError("")
                                            void handleSaveSettings({ focus_duration: method.focus, short_break: method.short, long_break: method.long })
                                                .catch(() => setSettingsError("Impossible d’appliquer cette méthode. Réessaie."))
                                        }}
                                    >
                                        <span className="flow-method-emoji">{method.emoji}</span>
                                        <span className="flow-method-name">{method.label}</span>
                                        <span className="flow-method-duration">{method.focus} min de focus</span>
                                        <span className="flow-method-description">{method.description}</span>
                                    </button>
                                ))}
                            </div>
                            {settingsError && !showSettings && <p className="flow-form-message error" role="alert">{settingsError}</p>}
                        </section>
                    </div>

                    <aside className="flow-side-column">
                        <section className="flow-card flow-task-section">
                            <div className="flow-section-heading">
                                <div>
                                    <p className="flow-overline">GARDER LE CAP</p>
                                    <h2 className="flow-card-title">Tâche en cours</h2>
                                </div>
                                <span className="flow-heading-icon" aria-hidden="true">◎</span>
                            </div>
                            <label className="flow-label" htmlFor="flow-task-select">Sur quoi veux-tu avancer ?</label>
                            <select id="flow-task-select" className="flow-select" value={selectedTaskId ?? ""} onChange={event => setSelectedTaskId(event.target.value ? Number(event.target.value) : null)}>
                                <option value="">Aucune tâche sélectionnée</option>
                                {tasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
                            </select>
                            {selectedTask ? (
                                <div className="flow-selected-task">
                                    <span className={"flow-task-priority priority-" + selectedTask.priority.toLowerCase()}>{selectedTask.priority}</span>
                                    <span className="flow-task-title">{selectedTask.title}</span>
                                </div>
                            ) : (
                                <p className="flow-helper-text">Choisis une tâche pour donner un objectif précis à cette session.</p>
                            )}
                        </section>

                        <section className="flow-card flow-ambient-section">
                            <div className="flow-section-heading">
                                <div>
                                    <p className="flow-overline">CRÉE TON AMBIANCE</p>
                                    <h2 className="flow-card-title">Sons de fond</h2>
                                </div>
                                <span className="flow-heading-icon" aria-hidden="true">♫</span>
                            </div>
                            <p className="flow-helper-text">Choisis un fond sonore pour accompagner tes sessions.</p>
                            <div className="flow-ambient-buttons">
                                {AMBIENT_SOUNDS.map(sound => (
                                    <button type="button" key={sound.value} className={"flow-ambient-btn" + (ambientSound === sound.value ? " active" : "")} aria-pressed={ambientSound === sound.value} onClick={() => setAmbientSound(sound.value)}>
                                        <span aria-hidden="true">{sound.emoji}</span>{sound.label}
                                    </button>
                                ))}
                            </div>
                            {ambientSound !== "none" && (
                                <div className="flow-volume">
                                    <label htmlFor="flow-ambient-volume">Volume</label>
                                    <input id="flow-ambient-volume" type="range" min={0} max={100} value={ambientVolume} onChange={event => setAmbientVolume(Number(event.target.value))} className="flow-range" aria-valuetext={ambientVolume + "%"} />
                                    <span className="flow-volume-value">{ambientVolume}%</span>
                                </div>
                            )}
                            <p className="flow-sound-note">{ambientSound === "none" ? "Le silence est aussi une bonne option." : "Le son démarre pendant le minuteur."}</p>
                        </section>

                        <section className="flow-card flow-settings-card">
                            <button type="button" className="flow-settings-btn" onClick={() => { setShowSettings(!showSettings); setSettingsError(""); }} aria-expanded={showSettings}>
                                <span className="flow-settings-icon" aria-hidden="true">⚙</span>
                                <span><strong>Personnaliser le minuteur</strong><small>Durées, cycles et démarrage automatique</small></span>
                                <span className={"flow-settings-chevron" + (showSettings ? " open" : "")} aria-hidden="true">⌄</span>
                            </button>

                            {showSettings && settings && (
                                <div className="flow-settings-panel">
                                    <div className="flow-settings-grid">
                                        <div className="flow-setting-field">
                                            <label htmlFor="flow-focus-duration">Concentration (min)</label>
                                            <input className="flow-setting-input" type="number" min={1} max={180} defaultValue={settings.focus_duration} id="flow-focus-duration" />
                                        </div>
                                        <div className="flow-setting-field">
                                            <label htmlFor="flow-short-break">Pause courte (min)</label>
                                            <input className="flow-setting-input" type="number" min={1} max={60} defaultValue={settings.short_break} id="flow-short-break" />
                                        </div>
                                        <div className="flow-setting-field">
                                            <label htmlFor="flow-long-break">Pause longue (min)</label>
                                            <input className="flow-setting-input" type="number" min={1} max={60} defaultValue={settings.long_break} id="flow-long-break" />
                                        </div>
                                        <div className="flow-setting-field">
                                            <label htmlFor="flow-pomodoros-until-long">Sessions par cycle</label>
                                            <input className="flow-setting-input" type="number" min={2} max={12} defaultValue={settings.pomodoros_until_long} id="flow-pomodoros-until-long" />
                                        </div>
                                        <div className="flow-setting-field flow-setting-field-full">
                                            <label htmlFor="flow-auto-start-break">Démarrage automatique de l’étape suivante</label>
                                            <select className="flow-setting-input" defaultValue={settings.auto_start_break ? "true" : "false"} id="flow-auto-start-break">
                                                <option value="false">Désactivé — je décide quand continuer</option>
                                                <option value="true">Activé — enchaîner automatiquement</option>
                                            </select>
                                        </div>
                                    </div>
                                    {settingsError && <p className="flow-form-message error" role="alert">{settingsError}</p>}
                                    {settingsSaved && <p className="flow-form-message success" role="status">Paramètres enregistrés.</p>}
                                    <button type="button" className="flow-save-settings" onClick={() => void saveTimerSettings()}>Enregistrer les paramètres</button>
                                </div>
                            )}
                        </section>
                    </aside>
                </div>

                <section className="flow-stats-section">
                    <div className="flow-section-heading">
                        <div>
                            <p className="flow-overline">PETITS PAS, GRANDS RÉSULTATS</p>
                            <h2 className="flow-card-title">Tes statistiques de concentration</h2>
                        </div>
                    </div>
                    <div className="flow-stats">
                        <article className="flow-stat"><span className="flow-stat-icon" aria-hidden="true">◷</span><span className="flow-stat-value">{stats.todaySessions}</span><span className="flow-stat-label">Sessions aujourd’hui</span></article>
                        <article className="flow-stat"><span className="flow-stat-icon" aria-hidden="true">⌛</span><span className="flow-stat-value">{formatDuration(stats.todayMinutes)}</span><span className="flow-stat-label">Concentration aujourd’hui</span></article>
                        <article className="flow-stat"><span className="flow-stat-icon" aria-hidden="true">↗</span><span className="flow-stat-value">{stats.totalSessions}</span><span className="flow-stat-label">Sessions au total</span></article>
                        <article className="flow-stat"><span className="flow-stat-icon" aria-hidden="true">✦</span><span className="flow-stat-value">{formatDuration(stats.totalMinutes)}</span><span className="flow-stat-label">Concentration cumulée</span></article>
                    </div>
                </section>
            </main>
        </div>
    )
}
