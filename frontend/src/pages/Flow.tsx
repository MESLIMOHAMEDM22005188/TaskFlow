import "../assets/css/flow.css"
import { useFlow } from "../services/Flow"

const AMBIENT_SOUNDS = [
    { value: "none", label: "🔇 Silence" },
    { value: "rain", label: "🌧 Pluie légère" },
    { value: "heavy_rain", label: "⛈ Pluie forte" },
    { value: "forest", label: "🌲 Forêt" },
    { value: "waves", label: "🌊 Vagues" },
    { value: "fire", label: "🔥 Feu de camp" },
    { value: "cafe", label: "☕ Café" },
    { value: "wind", label: "💨 Vent" },
    { value: "night", flowlabel: "🌙 Nuit" },
    { value: "river", label: "🏞 Rivière" },
    { value: "lofi", label: "🎵 Lofi" },
]

export default function Flow() {

    const {
        navigate,
        settings,
        showSettings, setShowSettings,
        mode, switchMode,
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
    } = useFlow()

    const selectedTask = tasks.find(t => t.id === selectedTaskId)

    return (
        <div className="flow-page">

            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    <div className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</div>
                    <div className="nav-item" onClick={() => navigate("/objectifs")}>Objectifs</div>
                    <div className="nav-item" onClick={() => navigate("/flow")}>Flow</div>
                    <div className="nav-item" onClick={() => navigate("/stats")}>Stats</div>
                    <div className="nav-item" onClick={() => navigate("/habitudes")}>Habitudes</div>
                    <div className="nav-item" onClick={() => navigate("/profil")}>Profil</div>
                    <div className="nav-item" onClick={() => navigate("/communaute")}>Communauté</div>
                    <div className="nav-item" onClick={() => navigate("/historique")}>Historique</div>
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                    </div>
                </nav>
            </header>

            <main className="flow-main">
                {/* MÉTHODE DE FOCUS */}
                <div className="flow-methods">
                    <label className="flow-label">Méthode</label>
                    <div className="flow-method-buttons">
                        {[
                            { label: "🍅 Pomodoro", focus: 25, short: 5, long: 15 },
                            { label: "⚡ 52/17", focus: 52, short: 17, long: 17 },
                            { label: "🧠 Deep Work", focus: 90, short: 20, long: 20 },
                            { label: "🔄 90/20", focus: 90, short: 20, long: 20 },
                            { label: "⏱ 52/17 Ultra", focus: 52, short: 17, long: 30 },
                            { label: "🎯 Timebox", focus: 45, short: 10, long: 15 },
                            { label: "🌊 Flow State", focus: 120, short: 30, long: 30 },
                            { label: "📚 Ultradian", focus: 90, short: 20, long: 20 },
                        ].map(m => (
                            <button
                                key={m.label}
                                className="flow-method-btn"
                                onClick={() => handleSaveSettings({
                                    ...settings,
                                    focus_duration: m.focus,
                                    short_break: m.short,
                                    long_break: m.long,
                                })}
                            >
                                {m.label}
                                <span className="flow-method-duration">{m.focus}min</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* MODE TABS */}
                <div className="flow-modes">
                    <button
                        className={`flow-mode-btn ${mode === "focus" ? "active" : ""}`}
                        onClick={() => switchMode("focus")}
                    >
                        Focus
                    </button>
                    <button
                        className={`flow-mode-btn ${mode === "short_break" ? "active" : ""}`}
                        onClick={() => switchMode("short_break")}
                    >
                        Pause courte
                    </button>
                    <button
                        className={`flow-mode-btn ${mode === "long_break" ? "active" : ""}`}
                        onClick={() => switchMode("long_break")}
                    >
                        Pause longue
                    </button>
                </div>

                {/* TIMER */}
                <div className="flow-timer-wrapper">
                    <svg className="flow-progress-ring" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="90" className="ring-bg" />
                        <circle
                            cx="100" cy="100" r="90"
                            className="ring-fill"
                            strokeDasharray={`${2 * Math.PI * 90}`}
                            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressPercent / 100)}`}
                        />
                    </svg>
                    <div className="flow-timer-display">
                        <span className="flow-time">{minutes}:{seconds}</span>
                        <span className="flow-mode-label">
                            {mode === "focus" ? "Focus" : mode === "short_break" ? "Pause courte" : "Pause longue"}
                        </span>
                    </div>
                </div>

                {/* XP NOTIFICATION */}
                {lastXp && (
                    <div className="flow-xp-badge">
                        +{lastXp} XP 🎉
                    </div>
                )}

                {/* CONTROLS */}
                <div className="flow-controls">
                    <button className="flow-btn secondary" onClick={handleReset}>↺</button>
                    <button className="flow-btn primary" onClick={isRunning ? handlePause : handleStart}>
                        {isRunning ? "⏸" : "▶"}
                    </button>
                    <button className="flow-btn secondary" onClick={handleSkip}>⏭</button>
                </div>

                {/* POMODORO DOTS */}
                <div className="flow-pomodoros">
                    {Array.from({ length: settings?.pomodoros_until_long ?? 4 }).map((_, i) => (
                        <div
                            key={i}
                            className={`pomodoro-dot ${i < (pomodoroCount % (settings?.pomodoros_until_long ?? 4)) ? "done" : ""}`}
                        />
                    ))}
                </div>

                {/* TASK SELECTION */}
                <div className="flow-task-section">
                    <label className="flow-label">Tâche en cours</label>
                    <select
                        className="flow-select"
                        value={selectedTaskId ?? ""}
                        onChange={e => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">Aucune tâche sélectionnée</option>
                        {tasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                    {selectedTask && (
                        <div className="flow-selected-task">
                            <span className={`badge priority-${selectedTask.priority.toLowerCase()}`}>
                                {selectedTask.priority}
                            </span>
                            <span className="flow-task-title">{selectedTask.title}</span>
                        </div>
                    )}
                </div>

                {/* AMBIENT SOUND */}
                <div className="flow-ambient-section">
                    <label className="flow-label">Son d'ambiance</label>
                    <div className="flow-ambient-buttons">
                        {AMBIENT_SOUNDS.map(s => (
                            <button
                                key={s.value}
                                className={`flow-ambient-btn ${ambientSound === s.value ? "active" : ""}`}
                                onClick={() => setAmbientSound(s.value)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    {ambientSound !== "none" && (
                        <div className="flow-volume">
                            <span>🔈</span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={ambientVolume}
                                onChange={e => setAmbientVolume(Number(e.target.value))}
                                className="flow-range"
                            />
                            <span>🔊</span>
                        </div>
                    )}
                </div>

                {/* STATS DU JOUR */}
                <div className="flow-stats">
                    <div className="flow-stat">
                        <span className="flow-stat-value">{stats.todaySessions}</span>
                        <span className="flow-stat-label">Sessions aujourd'hui</span>
                    </div>
                    <div className="flow-stat">
                        <span className="flow-stat-value">{stats.todayMinutes}min</span>
                        <span className="flow-stat-label">Focus aujourd'hui</span>
                    </div>
                    <div className="flow-stat">
                        <span className="flow-stat-value">{stats.totalSessions}</span>
                        <span className="flow-stat-label">Sessions totales</span>
                    </div>
                    <div className="flow-stat">
                        <span className="flow-stat-value">{Math.round(stats.totalMinutes / 60)}h</span>
                        <span className="flow-stat-label">Focus total</span>
                    </div>
                </div>

                {/* SETTINGS */}
                <button className="flow-settings-btn" onClick={() => setShowSettings(!showSettings)}>
                    ⚙️ Paramètres du timer
                </button>

                {showSettings && settings && (
                    <div className="flow-settings-panel">
                        <div className="theme-field">
                            <label className="theme-label">Durée focus (min)</label>
                            <input
                                className="theme-input"
                                type="number"
                                defaultValue={settings.focus_duration}
                                id="focus_duration"
                            />
                        </div>
                        <div className="theme-field">
                            <label className="theme-label">Pause courte (min)</label>
                            <input
                                className="theme-input"
                                type="number"
                                defaultValue={settings.short_break}
                                id="short_break"
                            />
                        </div>
                        <div className="theme-field">
                            <label className="theme-label">Pause longue (min)</label>
                            <input
                                className="theme-input"
                                type="number"
                                defaultValue={settings.long_break}
                                id="long_break"
                            />
                        </div>
                        <div className="theme-field">
                            <label className="theme-label">Pomodoros avant pause longue</label>
                            <input
                                className="theme-input"
                                type="number"
                                defaultValue={settings.pomodoros_until_long}
                                id="pomodoros_until_long"
                            />
                        </div>
                        <div className="theme-field">
                            <label className="theme-label">Auto-start pause</label>
                            <select className="theme-select" defaultValue={settings.auto_start_break ? "true" : "false"} id="auto_start_break">
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </select>
                        </div>
                        <button className="main-button" onClick={() => {
                            handleSaveSettings({
                                focus_duration: Number((document.getElementById("focus_duration") as HTMLInputElement).value),
                                short_break: Number((document.getElementById("short_break") as HTMLInputElement).value),
                                long_break: Number((document.getElementById("long_break") as HTMLInputElement).value),
                                pomodoros_until_long: Number((document.getElementById("pomodoros_until_long") as HTMLInputElement).value),
                                auto_start_break: (document.getElementById("auto_start_break") as HTMLSelectElement).value === "true",
                                ambient_sound: ambientSound,
                                ambient_volume: ambientVolume,
                            })
                        }}>
                            Sauvegarder
                        </button>
                    </div>
                )}

            </main>

        </div>
    )
}