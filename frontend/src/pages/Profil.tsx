import { useState, useEffect, type ChangeEvent } from "react";
import "../assets/css/flow.css";
import { useFlow } from "../services/Flow";

// Types
type TimerMode = "focus" | "short_break" | "long_break";
type AmbientSound = {
    value: string;
    label: string;
};
type FormSettings = {
    focus_duration: number;
    short_break: number;
    long_break: number;
    pomodoros_until_long: number;
    auto_start_break: boolean;
};

const AMBIENT_SOUNDS: AmbientSound[] = [
    { value: "none", label: "🔇 Silence" },
    { value: "rain", label: "🌧 Pluie légère" },
    { value: "heavy_rain", label: "⛈ Pluie forte" },
    { value: "forest", label: "🌲 Forêt" },
    { value: "waves", label: "🌊 Vagues" },
    { value: "fire", label: "🔥 Feu de camp" },
    { value: "cafe", label: "☕ Café" },
    { value: "wind", label: "💨 Vent" },
    { value: "night", label: "🌙 Nuit" },
    { value: "river", label: "🏞 Rivière" },
    { value: "lofi", label: "🎵 Lofi" },
];

export function Flow() {
    const {
        navigate,
        settings,
        showSettings,
        setShowSettings,
        mode,
        switchMode,
        isRunning,
        pomodoroCount,
        minutes,
        seconds,
        progressPercent,
        tasks,
        selectedTaskId,
        setSelectedTaskId,
        stats,
        ambientSound,
        setAmbientSound,
        ambientVolume,
        setAmbientVolume,
        lastXp,
        handleStart,
        handlePause,
        handleReset,
        handleSkip,
        handleSaveSettings,
    } = useFlow();

    // Tâche sélectionnée
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);

    // Gestion des inputs des paramètres
    const [formSettings, setFormSettings] = useState<FormSettings>({
        focus_duration: 25,
        short_break: 5,
        long_break: 15,
        pomodoros_until_long: 4,
        auto_start_break: false,
    });

    // Mise à jour des paramètres locaux uniquement si `settings` change
    useEffect(() => {
        if (settings) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormSettings((prev) => {
                // Évite les mises à jour inutiles
                if (
                    prev.focus_duration === settings.focus_duration &&
                    prev.short_break === settings.short_break &&
                    prev.long_break === settings.long_break &&
                    prev.pomodoros_until_long === settings.pomodoros_until_long &&
                    prev.auto_start_break === settings.auto_start_break
                ) {
                    return prev; // Pas de changement, pas de re-rendu
                }
                return {
                    focus_duration: settings.focus_duration,
                    short_break: settings.short_break,
                    long_break: settings.long_break,
                    pomodoros_until_long: settings.pomodoros_until_long,
                    auto_start_break: settings.auto_start_break,
                };
            });
        }
    }, [settings]);

    // Gestion des changements de formulaire
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {id, type, value, checked} = e.target;
        setFormSettings((prev) => ({
            ...prev,
            [id]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
        }));
    };

    // Sauvegarde des paramètres
    const saveSettings = () => {
        handleSaveSettings({
            ...formSettings,
            ambient_sound: ambientSound,
            ambient_volume: ambientVolume,
        });
    };

    return (
        <div className="flow-page">
            {/* Header */}
            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    {[
                        {path: "/dashboard", label: "Dashboard"},
                        {path: "/objectifs", label: "Objectifs"},
                        {path: "/flow", label: "Flow"},
                        {path: "/profil", label: "Profil"},
                        {path: "/communaute", label: "Communauté"},
                        {path: "/parametres", label: "Paramètres"},
                    ].map((item) => (
                        <div key={item.path} className="nav-item" onClick={() => navigate(item.path)}>
                            {item.label}
                        </div>
                    ))}
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                    </div>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flow-main">
                {/* Mode Tabs */}
                <div className="flow-modes">
                    {[
                        {mode: "focus" as TimerMode, label: "Focus"},
                        {mode: "short_break" as TimerMode, label: "Pause courte"},
                        {mode: "long_break" as TimerMode, label: "Pause longue"},
                    ].map((tab) => (
                        <button
                            key={tab.mode}
                            className={`flow-mode-btn ${mode === tab.mode ? "active" : ""}`}
                            onClick={() => switchMode(tab.mode)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Timer */}
                <div className="flow-timer-wrapper">
                    <svg className="flow-progress-ring" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="90" className="ring-bg"/>
                        <circle
                            cx="100"
                            cy="100"
                            r="90"
                            className="ring-fill"
                            strokeDasharray={`${2 * Math.PI * 90}`}
                            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progressPercent / 100)}`}
                        />
                    </svg>
                    <div className="flow-timer-display">
            <span className="flow-time">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
                        <span className="flow-mode-label">
              {mode === "focus" ? "Focus" : mode === "short_break" ? "Pause courte" : "Pause longue"}
            </span>
                    </div>
                </div>

                {/* XP Notification */}
                {lastXp && (
                    <div className="flow-xp-badge">+{lastXp} XP 🎉</div>
                )}

                {/* Controls */}
                <div className="flow-controls">
                    <button className="flow-btn secondary" onClick={handleReset}>
                        ↺
                    </button>
                    <button className="flow-btn primary" onClick={isRunning ? handlePause : handleStart}>
                        {isRunning ? "⏸" : "▶"}
                    </button>
                    <button className="flow-btn secondary" onClick={handleSkip}>
                        ⏭
                    </button>
                </div>

                {/* Pomodoro Dots */}
                <div className="flow-pomodoros">
                    {Array.from({length: settings?.pomodoros_until_long ?? 4}).map((_, i) => (
                        <div
                            key={i}
                            className={`pomodoro-dot ${i < pomodoroCount % (settings?.pomodoros_until_long ?? 4) ? "done" : ""}`}
                        />
                    ))}
                </div>

                {/* Task Selection */}
                <div className="flow-task-section">
                    <label className="flow-label">Tâche en cours</label>
                    <select
                        className="flow-select"
                        value={selectedTaskId ?? ""}
                        onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">Aucune tâche sélectionnée</option>
                        {tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
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

                {/* Ambient Sound */}
                <div className="flow-ambient-section">
                    <label className="flow-label">Son d'ambiance</label>
                    <div className="flow-ambient-buttons">
                        {AMBIENT_SOUNDS.map((s) => (
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
                                onChange={(e) => setAmbientVolume(Number(e.target.value))}
                                className="flow-range"
                            />
                            <span>🔊</span>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flow-stats">
                    {[
                        {label: "Sessions aujourd'hui", value: stats.todaySessions},
                        {label: "Focus aujourd'hui", value: `${stats.todayMinutes}min`},
                        {label: "Sessions totales", value: stats.totalSessions},
                        {label: "Focus total", value: `${Math.round(stats.totalMinutes / 60)}h`},
                    ].map((stat, index) => (
                        <div key={index} className="flow-stat">
                            <span className="flow-stat-value">{stat.value}</span>
                            <span className="flow-stat-label">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Settings */}
                <button className="flow-settings-btn" onClick={() => setShowSettings(!showSettings)}>
                    ⚙️ Paramètres du timer
                </button>

                {showSettings && (
                    <div className="flow-settings-panel">
                        {[
                            {id: "focus_duration", label: "Durée focus (min)", type: "number"},
                            {id: "short_break", label: "Pause courte (min)", type: "number"},
                            {id: "long_break", label: "Pause longue (min)", type: "number"},
                            {id: "pomodoros_until_long", label: "Pomodoros avant pause longue", type: "number"},
                            {id: "auto_start_break", label: "Auto-start pause", type: "checkbox"},
                        ].map((field) => (
                            <div key={field.id} className="theme-field">
                                <label className="theme-label" htmlFor={field.id}>
                                    {field.label}
                                </label>
                                <input
                                    id={field.id}
                                    type={field.type}
                                    checked={field.type === "checkbox" ? formSettings[field.id as keyof FormSettings] as boolean : undefined}
                                    onChange={handleInputChange}
                                    className="theme-input"
                                />
                            </div>
                        ))}
                        <button className="main-button" onClick={saveSettings}>
                            Sauvegarder
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
