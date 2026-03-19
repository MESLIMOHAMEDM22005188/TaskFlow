import { useState, useEffect } from "react"
import "../assets/css/habitudes.css"
import { useHabitudes } from "../services/Habitudes"
import { getHabitHeatmap } from "../services/taskService"

const CATEGORIES = [
    { value: "health", label: "💪 Santé" },
    { value: "mental", label: "🧠 Mental" },
    { value: "spiritual", label: "📿 Spirituel" },
    { value: "social", label: "👥 Social" },
    { value: "productivity", label: "💼 Productivité" },
    { value: "other", label: "✨ Autre" },
]

const MILESTONES_LABELS: Record<number, string> = {
    7: "🌱 7 jours",
    30: "🔥 30 jours",
    90: "💪 90 jours",
    180: "⚡ 180 jours",
    365: "👑 365 jours",
}

function SoberCounter({ startDate, color }: { startDate: string, color: string }) {
    const [elapsed, setElapsed] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        function calculate() {
            const start = new Date(startDate)
            const now = new Date()
            const diff = now.getTime() - start.getTime()
            setElapsed({
                years: Math.floor(diff / (86400000 * 365)),
                months: Math.floor(diff / (86400000 * 30)) % 12,
                days: Math.floor(diff / 86400000) % 30,
                hours: Math.floor(diff / 3600000) % 24,
                minutes: Math.floor(diff / 60000) % 60,
                seconds: Math.floor(diff / 1000) % 60,
            })
        }
        calculate()
        const interval = setInterval(calculate, 1000)
        return () => clearInterval(interval)
    }, [startDate])

    const units = [
        { value: elapsed.years, label: "ans" },
        { value: elapsed.months, label: "mois" },
        { value: elapsed.days, label: "jours" },
        { value: elapsed.hours, label: "heures" },
        { value: elapsed.minutes, label: "minutes" },
        { value: elapsed.seconds, label: "secondes" },
    ]

    return (
        <div className="sober-counter">
            <p className="sober-title">🏆 Sobre depuis</p>
            {units.map((u, i) => (
                <div key={i} className="sober-row" style={{ background: `linear-gradient(135deg, ${color}99, ${color}44)`, width: `${100 - i * 8}%` }}>
                    <span className="sober-value">{u.value}</span>
                    <span className="sober-label">{u.label}</span>
                </div>
            ))}
        </div>
    )
}

function HabitHeatmap({ habitId }: { habitId: number }) {
    const [logs, setLogs] = useState<{ date: string, type: string }[]>([])
    const [open, setOpen] = useState(false)
    const [loaded, setLoaded] = useState(false)

    function handleOpen() {
        setOpen(!open)
        if (!loaded) {
            getHabitHeatmap(habitId)
                .then(data => { setLogs(data); setLoaded(true) })
                .catch(err => console.error(err))
        }
    }

    const logMap: Record<string, string> = {}
    logs.forEach(l => { logMap[l.date] = l.type })
    const days = []
    for (let i = 364; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split("T")[0]
        days.push({ date: key, type: logMap[key] ?? null, dayOfWeek: d.getDay() })
    }

    function getCellColor(type: string | null): string {
        if (type === "success") return "#22c55e"
        if (type === "relapse") return "#ef4444"
        return "rgba(255,255,255,0.05)"
    }

    return (
        <div className="habit-heatmap-wrapper">
            <button className="habit-heatmap-toggle" onClick={handleOpen}>
                {open ? "▲ Masquer l'activité" : "▼ Voir l'activité"}
            </button>
            {open && (
                <>
                    <div className="habit-heatmap">
                        {days.map(day => (
                            <div key={day.date} className="habit-heatmap-cell"
                                 style={{ background: getCellColor(day.type), gridRow: day.dayOfWeek + 1 }}
                                 title={`${day.date}${day.type ? ` — ${day.type}` : ""}`}
                            />
                        ))}
                    </div>
                    <div className="habit-heatmap-legend">
                        <div className="habit-heatmap-legend-item">
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e" }} />
                            <span>Réussi</span>
                        </div>
                        <div className="habit-heatmap-legend-item">
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} />
                            <span>Rechute</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default function Habitudes() {

    const {
        navigate, loading,
        buildHabits, quitHabits,
        showForm, setShowForm,
        relapseHabitId, setRelapseHabitId,
        relapseNote, setRelapseNote,
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
        timesPerDay, setTimesPerDay,
        startDate, setStartDate,
        handleCreateHabit,
        handleSuccess,
        handleUndo,
        handleRelapse,
        handleDelete,
        getNextMilestone,
        getDifficultyColor,
        getDangerColor,
    } = useHabitudes()

    if (loading) return <div className="habitudes-page"><div className="habitudes-loading">Chargement...</div></div>

    return (
        <div className="habitudes-page">

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
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                    </div>
                </nav>
            </header>

            <main className="habitudes-main">

                <div className="habitudes-hero">
                    <h1 className="habitudes-title">Habitudes</h1>
                    <p className="habitudes-subtitle">Construis ta meilleure version, un jour à la fois.</p>
                </div>

                {lastXp && (
                    <div className="habit-xp-badge">+{lastXp.xp} XP 🎉</div>
                )}

                <div className="action-center">
                    <button className={`main-button ${showForm ? "active" : ""}`} onClick={() => setShowForm(!showForm)}>
                        {showForm ? "✕ Fermer" : "+ Nouvelle habitude"}
                    </button>
                </div>

                {showForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">

                            <div className="habit-type-selector">
                                <button className={`habit-type-btn ${type === "build" ? "active build" : ""}`} onClick={() => setType("build")}>
                                    ✅ Bonne habitude
                                </button>
                                <button className={`habit-type-btn ${type === "quit" ? "active quit" : ""}`} onClick={() => setType("quit")}>
                                    🚫 Addiction à abandonner
                                </button>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Nom</label>
                                <input className="theme-input" placeholder="Ex: Méditation quotidienne..." value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Catégorie</label>
                                <select className="theme-select" value={category} onChange={e => setCategory(e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>

                            <div className="habit-form-row">
                                <div className="theme-field">
                                    <label className="theme-label">Emoji</label>
                                    <input className="theme-input" placeholder="🧘" maxLength={2} value={emoji} onChange={e => setEmoji(e.target.value)} />
                                </div>
                                <div className="theme-field">
                                    <label className="theme-label">Couleur</label>
                                    <div className="color-picker">
                                        {["#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"].map(c => (
                                            <div key={c} className={`color-dot ${color === c ? "selected" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="habit-form-row">
                                <div className="theme-field">
                                    <label className="theme-label">Fréquence</label>
                                    <select className="theme-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                                        <option value="daily">Quotidienne — prochain : demain</option>
                                        <option value="weekly">Hebdomadaire — prochain : dans une semaine</option>
                                    </select>
                                </div>
                                <div className="theme-field">
                                    <label className="theme-label">Fois par jour</label>
                                    <input className="theme-input" type="number" min={1} max={20} value={timesPerDay} onChange={e => setTimesPerDay(Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Difficulté</label>
                                <select className="theme-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                    <option value="easy">Facile (+5 XP)</option>
                                    <option value="medium">Moyen (+15 XP)</option>
                                    <option value="hard">Difficile (+30 XP)</option>
                                    <option value="extreme">Extrême (+50 XP)</option>
                                </select>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Ma motivation <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" placeholder="Pourquoi cette habitude est importante pour moi..." value={motivation} onChange={e => setMotivation(e.target.value)} />
                            </div>

                            {type === "quit" && (
                                <>
                                    <div className="theme-field">
                                        <label className="theme-label">Sobre depuis <span className="theme-label-hint">(optionnel)</span></label>
                                        <input className="theme-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div className="theme-field">
                                        <label className="theme-label">Niveau de danger</label>
                                        <select className="theme-select" value={dangerLevel} onChange={e => setDangerLevel(e.target.value)}>
                                            <option value="low">🟢 Faible</option>
                                            <option value="medium">🟡 Moyen</option>
                                            <option value="high">🔴 Élevé</option>
                                        </select>
                                    </div>
                                    <div className="theme-field">
                                        <label className="theme-label">Mes déclencheurs <span className="theme-label-hint">(optionnel)</span></label>
                                        <input className="theme-input" placeholder="Ex: Stress, ennui, solitude..." value={triggers} onChange={e => setTriggers(e.target.value)} />
                                    </div>
                                    <div className="theme-field">
                                        <label className="theme-label">Mon plan en cas de rechute <span className="theme-label-hint">(optionnel)</span></label>
                                        <input className="theme-input" placeholder="Ex: Appeler un ami, faire du sport..." value={relapsePlan} onChange={e => setRelapsePlan(e.target.value)} />
                                    </div>
                                </>
                            )}

                            <div className="habit-private-row">
                                <label className="theme-label">Mode privé</label>
                                <label className="switch">
                                    <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <button className="main-button" onClick={handleCreateHabit}>Créer l'habitude</button>
                        </div>
                    </div>
                )}

                {/* BONNES HABITUDES */}
                <section className="habitudes-section">
                    <div className="habitudes-section-header">
                        <h2 className="habitudes-section-title">✅ Habitudes</h2>
                        <span className="habitudes-count">{buildHabits.filter(h => h.doneToday).length}/{buildHabits.length} aujourd'hui</span>
                    </div>

                    {buildHabits.length === 0 && (
                        <div className="habitudes-empty">
                            <p>Aucune habitude — crée ta première !</p>
                        </div>
                    )}

                    {buildHabits.map(habit => (
                        <div key={habit.id} className={`habit-card ${habit.doneToday ? "done" : ""}`} style={{ borderLeft: `4px solid ${habit.color}` }}>

                            <div className="habit-top">
                                <div className="habit-left">
                                    <div className="habit-emoji-wrapper" style={{ background: `${habit.color}22` }}>
                                        <span className="habit-emoji">{habit.emoji ?? "✅"}</span>
                                    </div>
                                    <div>
                                        <h3 className="habit-name">{habit.name}</h3>
                                        <div className="habit-meta">
                                            <span className="habit-badge" style={{ color: getDifficultyColor(habit.difficulty), background: `${getDifficultyColor(habit.difficulty)}22` }}>{habit.difficulty}</span>
                                            <span className="habit-badge">{CATEGORIES.find(c => c.value === habit.category)?.label}</span>
                                            {habit.times_per_day > 1 && <span className="habit-badge" style={{ color: habit.color, background: `${habit.color}22` }}>×{habit.times_per_day}/jour</span>}
                                            {habit.is_private && <span className="habit-badge">🔒</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="habit-streak">
                                    <span className="habit-streak-value" style={{ background: `linear-gradient(90deg, ${habit.color}, #a855f7)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{habit.streak}</span>
                                    <span className="habit-streak-label">🔥 jours</span>
                                </div>
                            </div>

                            {/* PROGRESS MILESTONE */}
                            {(() => {
                                const next = getNextMilestone(habit.streak)
                                if (!next) return <p className="habit-milestone-done">🏆 Tous les milestones atteints !</p>
                                const prev = [7, 30, 90, 180, 365].filter(m => m <= habit.streak).pop() ?? 0
                                const progress = ((habit.streak - prev) / (next - prev)) * 100
                                return (
                                    <div className="habit-milestone-progress">
                                        <div className="habit-milestone-header">
                                            <span>Prochain : {MILESTONES_LABELS[next]}</span>
                                            <span>{habit.streak}/{next} jours</span>
                                        </div>
                                        <div className="habit-progress-bar">
                                            <div className="habit-progress-fill" style={{ width: `${progress}%`, background: habit.color }} />
                                        </div>
                                    </div>
                                )
                            })()}

                            {/* TIMES PER DAY DOTS */}
                            {habit.times_per_day > 1 && (
                                <div className="habit-times-dots">
                                    {Array.from({ length: habit.times_per_day }).map((_, i) => (
                                        <div key={i} className="habit-times-dot" style={{ background: i < habit.todayCount ? habit.color : "rgba(255,255,255,0.1)" }} />
                                    ))}
                                </div>
                            )}

                            {habit.motivation && <p className="habit-motivation">💭 {habit.motivation}</p>}

                            {habit.sparkCount > 0 && !habit.doneToday && (
                                <div className="habit-sparks">
                                    <span className="habit-sparks-label">
                                        {habit.sparkCount === 1 && "⚡ 1 étincelle — encore 2 et ton streak est en danger"}
                                        {habit.sparkCount === 2 && "⚡⚡ 2 étincelles — attention !"}
                                        {habit.sparkCount >= 3 && "💀 3 étincelles — ton streak est en danger !"}
                                    </span>
                                </div>
                            )}

                            <HabitHeatmap habitId={habit.id} />

                            <div className="habit-actions">
                                {habit.doneToday ? (
                                    <button className="habit-btn done" onClick={() => handleUndo(habit.id)}>
                                        ✓ {habit.times_per_day > 1 ? `${habit.todayCount}/${habit.times_per_day}` : "Fait"} — Annuler
                                    </button>
                                ) : (
                                    <button
                                        className="habit-btn success"
                                        onClick={() => handleSuccess(habit.id)}
                                        disabled={habit.todayCount >= habit.times_per_day}
                                    >
                                        {habit.times_per_day > 1
                                            ? `+ Faire (${habit.todayCount}/${habit.times_per_day})`
                                            : "✓ Fait aujourd'hui"
                                        }
                                    </button>
                                )}
                                <button className="habit-btn delete" onClick={() => handleDelete(habit.id)}>🗑</button>
                            </div>

                            <p className="habit-next">⏭ Prochain : {habit.frequency === "daily" ? "Demain" : "Dans une semaine"}</p>

                        </div>
                    ))}
                </section>

                {/* ADDICTIONS */}
                <section className="habitudes-section">
                    <div className="habitudes-section-header">
                        <h2 className="habitudes-section-title">🚫 Addictions</h2>
                        <span className="habitudes-count">{quitHabits.length} trackées</span>
                    </div>

                    {quitHabits.length === 0 && (
                        <div className="habitudes-empty">
                            <p>Aucune addiction trackée.</p>
                        </div>
                    )}

                    {quitHabits.map(habit => (
                        <div key={habit.id} className="habit-card quit-card" style={{ borderLeft: `4px solid ${habit.color}` }}>

                            <div className="habit-top">
                                <div className="habit-left">
                                    <div className="habit-emoji-wrapper" style={{ background: `${habit.color}22` }}>
                                        <span className="habit-emoji">{habit.emoji ?? "🚫"}</span>
                                    </div>
                                    <div>
                                        <h3 className="habit-name">{habit.name}</h3>
                                        <div className="habit-meta">
                                            <span className="habit-badge" style={{ color: getDangerColor(habit.danger_level), background: `${getDangerColor(habit.danger_level)}22` }}>
                                                ⚠️ {habit.danger_level}
                                            </span>
                                            <span className="habit-badge">{CATEGORIES.find(c => c.value === habit.category)?.label}</span>
                                            {habit.is_private && <span className="habit-badge">🔒</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="habit-streak">
                                    <span className="habit-streak-value" style={{ background: `linear-gradient(90deg, ${habit.color}, #a855f7)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{habit.streak}</span>
                                    <span className="habit-streak-label">🔥 jours sans</span>
                                </div>
                            </div>

                            {(() => {
                                const next = getNextMilestone(habit.streak)
                                if (!next) return <p className="habit-milestone-done">🏆 Tous les milestones atteints !</p>
                                const prev = [7, 30, 90, 180, 365].filter(m => m <= habit.streak).pop() ?? 0
                                const progress = ((habit.streak - prev) / (next - prev)) * 100
                                return (
                                    <div className="habit-milestone-progress">
                                        <div className="habit-milestone-header">
                                            <span>Prochain : {MILESTONES_LABELS[next]}</span>
                                            <span>{habit.streak}/{next} jours</span>
                                        </div>
                                        <div className="habit-progress-bar">
                                            <div className="habit-progress-fill" style={{ width: `${progress}%`, background: habit.color }} />
                                        </div>
                                    </div>
                                )
                            })()}

                            {habit.start_date && <SoberCounter startDate={habit.start_date} color={habit.color} />}

                            <HabitHeatmap habitId={habit.id} />

                            <div className="habit-info-grid">
                                {habit.triggers && <p className="habit-info-item">⚡ <strong>Déclencheurs :</strong> {habit.triggers}</p>}
                                {habit.relapse_plan && <p className="habit-info-item">🛡 <strong>Plan :</strong> {habit.relapse_plan}</p>}
                                {habit.lastRelapse && <p className="habit-info-item">📅 <strong>Dernière rechute :</strong> {new Date(habit.lastRelapse).toLocaleDateString()}</p>}
                            </div>

                            <div className="habit-stats-row">
                                <div className="habit-stat-pill">✅ {habit.totalSuccess} jours réussis</div>
                                <div className="habit-stat-pill danger">↩ {habit.relapseCount} rechutes</div>
                            </div>

                            {relapseHabitId === habit.id ? (
                                <div className="relapse-form">
                                    <p className="relapse-message">
                                        C'est ok. Tu as déjà tenu {habit.streak} jours 💪 Chaque jour compte.
                                    </p>
                                    <input className="theme-input" placeholder="Note optionnelle..." value={relapseNote} onChange={e => setRelapseNote(e.target.value)} />
                                    <div className="relapse-form-actions">
                                        <button className="habit-btn relapse-confirm" onClick={() => handleRelapse(habit.id)}>Confirmer</button>
                                        <button className="habit-btn" onClick={() => setRelapseHabitId(null)}>Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="habit-actions">
                                    <button className="habit-btn success" onClick={() => handleSuccess(habit.id)}>✓ Jour sans rechute</button>
                                    <button className="habit-btn relapse" onClick={() => setRelapseHabitId(habit.id)}>↩ Rechute</button>
                                    <button className="habit-btn delete" onClick={() => handleDelete(habit.id)}>🗑</button>
                                </div>
                            )}

                        </div>
                    ))}
                </section>

            </main>
        </div>
    )
}