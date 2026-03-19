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
    7: "🌱 1 semaine",
    30: "🔥 1 mois",
    90: "💪 3 mois",
    180: "⚡ 6 mois",
    365: "👑 1 an",
}

function SoberCounter({ startDate, color }: { startDate: string, color: string }) {
    const [elapsed, setElapsed] = useState({ years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
    useEffect(() => {
        function calculate() {
            const start = new Date(startDate)
            const now = new Date()
            const diff = now.getTime() - start.getTime()
            const seconds = Math.floor(diff / 1000) % 60
            const minutes = Math.floor(diff / 60000) % 60
            const hours = Math.floor(diff / 3600000) % 24
            const days = Math.floor(diff / 86400000) % 30
            const months = Math.floor(diff / (86400000 * 30)) % 12
            const years = Math.floor(diff / (86400000 * 365))
            setElapsed({ years, months, days, hours, minutes, seconds })
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
                <div
                    key={i}
                    className="sober-row"
                    style={{
                        background: `linear-gradient(135deg, ${color}99, ${color}44)`,
                        width: `${100 - i * 8}%`
                    }}
                >
                    <span className="sober-value">{u.value}</span>
                    <span className="sober-label">{u.label}</span>
                </div>
            ))}
        </div>
    )
}

function HabitHeatmap({ habitId }: { habitId: number }) {
    const [logs, setLogs] = useState<{ date: string, type: string }[]>([])
    useEffect(() => {
        getHabitHeatmap(habitId)
            .then(data => setLogs(data))
            .catch(err => console.error(err))
    }, [habitId])
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
            <div className="habit-heatmap">
                {days.map(day => (
                    <div
                        key={day.date}
                        className="habit-heatmap-cell"
                        style={{
                            background: getCellColor(day.type),
                            gridRow: day.dayOfWeek + 1
                        }}
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
        </div>
    )
}

export default function Habitudes() {

    const {
        navigate,
        loading,
        buildHabits,
        quitHabits,
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
        handleCreateHabit,
        handleSuccess,
        handleUndo,
        handleRelapse,
        handleDelete,
        getNextMilestone,
        getDifficultyColor,
        getDangerColor,
    } = useHabitudes()

    if (loading) return <div className="habitudes-page">Loading...</div>

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

                <h1 className="habitudes-title">Habitudes</h1>

                {lastXp && (
                    <div className="habit-xp-badge">+{lastXp.xp} XP 🎉</div>
                )}

                <div className="action-center">
                    <button
                        className={`main-button ${showForm ? "active" : ""}`}
                        onClick={() => setShowForm(!showForm)}
                    >
                        + Nouvelle habitude
                    </button>
                </div>

                {showForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">
                            <div className="habit-type-selector">
                                <button className={`habit-type-btn ${type === "build" ? "active build" : ""}`} onClick={() => setType("build")}>
                                    ✅ Bonne habitude à construire
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
                                    {CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
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
                                        <option value="daily">Quotidienne</option>
                                        <option value="weekly">Hebdomadaire</option>
                                    </select>
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
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Ma motivation <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" placeholder="Pourquoi cette habitude est importante pour moi..." value={motivation} onChange={e => setMotivation(e.target.value)} />
                            </div>
                            {type === "quit" && (
                                <>
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
                            <button className="main-button" onClick={handleCreateHabit}>
                                Créer l'habitude
                            </button>
                        </div>
                    </div>
                )}

                {/* BONNES HABITUDES */}
                <section className="habitudes-section">
                    <h2 className="habitudes-section-title">✅ Habitudes à construire ({buildHabits.length})</h2>
                    {buildHabits.length === 0 && (
                        <p className="habitudes-empty">Aucune habitude — crée ta première !</p>
                    )}
                    {buildHabits.map(habit => (
                        <div key={habit.id} className={`habit-card ${habit.doneToday ? "done" : ""}`} style={{ borderLeft: `4px solid ${habit.color}` }}>
                            <div className="habit-top">
                                <div className="habit-left">
                                    <span className="habit-emoji">{habit.emoji ?? "✅"}</span>
                                    <div>
                                        <h3 className="habit-name">{habit.name}</h3>
                                        <div className="habit-meta">
                                            <span className="habit-badge" style={{ color: getDifficultyColor(habit.difficulty) }}>{habit.difficulty}</span>
                                            <span className="habit-badge">{CATEGORIES.find(c => c.value === habit.category)?.label}</span>
                                            <span className="habit-badge">{habit.frequency}</span>
                                            {habit.is_private && <span className="habit-badge">🔒 Privé</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="habit-streak">
                                    <span className="habit-streak-value">{habit.streak}</span>
                                    <span className="habit-streak-label">🔥 jours</span>
                                </div>
                            </div>
                            {(() => {
                                const next = getNextMilestone(habit.streak)
                                if (!next) return null
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
                            {habit.motivation && <p className="habit-motivation">💭 {habit.motivation}</p>}

                            {/* ✅ HEATMAP pour les bonnes habitudes */}
                            <HabitHeatmap habitId={habit.id} />

                            <div className="habit-actions">
                                {habit.doneToday ? (
                                    <button className="habit-btn done" onClick={() => handleUndo(habit.id)}>↩ Annuler</button>
                                ) : (
                                    <button className="habit-btn success" onClick={() => handleSuccess(habit.id)}>✓ Fait aujourd'hui</button>
                                )}
                                <button className="habit-btn delete" onClick={() => handleDelete(habit.id)}>🗑</button>
                            </div>
                        </div>
                    ))}
                </section>

                {/* ADDICTIONS */}
                <section className="habitudes-section">
                    <h2 className="habitudes-section-title">🚫 Addictions à abandonner ({quitHabits.length})</h2>
                    {quitHabits.length === 0 && (
                        <p className="habitudes-empty">Aucune addiction trackée.</p>
                    )}
                    {quitHabits.map(habit => (
                        <div key={habit.id} className="habit-card quit-card" style={{ borderLeft: `4px solid ${habit.color}` }}>
                            <div className="habit-top">
                                <div className="habit-left">
                                    <span className="habit-emoji">{habit.emoji ?? "🚫"}</span>
                                    <div>
                                        <h3 className="habit-name">{habit.name}</h3>
                                        <div className="habit-meta">
                                            <span className="habit-badge" style={{ color: getDangerColor(habit.danger_level) }}>⚠️ {habit.danger_level}</span>
                                            <span className="habit-badge">{CATEGORIES.find(c => c.value === habit.category)?.label}</span>
                                            {habit.is_private && <span className="habit-badge">🔒 Privé</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="habit-streak">
                                    <span className="habit-streak-value">{habit.streak}</span>
                                    <span className="habit-streak-label">🔥 jours sans</span>
                                </div>
                            </div>

                            {(() => {
                                const next = getNextMilestone(habit.streak)
                                if (!next) return null
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

                            {/* ✅ SOBER COUNTER */}
                            {habit.start_date && (
                                <SoberCounter startDate={habit.start_date} color={habit.color} />
                            )}

                            {/* ✅ HEATMAP */}
                            <HabitHeatmap habitId={habit.id} />

                            {habit.triggers && <p className="habit-triggers">⚡ Déclencheurs : {habit.triggers}</p>}
                            {habit.relapse_plan && <p className="habit-relapse-plan">🛡 Plan : {habit.relapse_plan}</p>}
                            {habit.lastRelapse && (
                                <p className="habit-last-relapse">Dernière rechute : {new Date(habit.lastRelapse).toLocaleDateString()}</p>
                            )}

                            <div className="habit-stats-row">
                                <span>✅ {habit.totalSuccess} jours réussis</span>
                                <span>↩ {habit.relapseCount} rechutes</span>
                            </div>

                            {relapseHabitId === habit.id ? (
                                <div className="relapse-form">
                                    <p className="relapse-message">
                                        C'est ok. Chaque jour sans rechute compte. Tu as déjà tenu {habit.streak} jours 💪
                                    </p>
                                    <input
                                        className="theme-input"
                                        placeholder="Note optionnelle sur ce qui s'est passé..."
                                        value={relapseNote}
                                        onChange={e => setRelapseNote(e.target.value)}
                                    />
                                    <div className="relapse-form-actions">
                                        <button className="habit-btn relapse-confirm" onClick={() => handleRelapse(habit.id)}>Confirmer la rechute</button>
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