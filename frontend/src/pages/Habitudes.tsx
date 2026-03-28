import { useState, useEffect } from "react"
import "../assets/css/habitudes.css"
import { useHabitudes } from "../services/Habitudes"
import { getHabitHeatmap } from "../services/taskService"
import type { Habit } from "../services/taskService"

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

// Addictions suggestions connues
const ADDICTION_SUGGESTIONS = [
    { emoji: "🚬", name: "Cigarettes", category: "health", danger: "high", unit: "cigarettes/jour", defaultQty: 10 },
    { emoji: "🍺", name: "Alcool", category: "health", danger: "high", unit: "verres/jour", defaultQty: 3 },
    { emoji: "📱", name: "Réseaux sociaux", category: "mental", danger: "medium", unit: "heures/jour", defaultQty: 3 },
    { emoji: "🎰", name: "Jeux d'argent", category: "other", danger: "high", unit: "sessions/semaine", defaultQty: 5 },
    { emoji: "🎮", name: "Jeux vidéo", category: "mental", danger: "medium", unit: "heures/jour", defaultQty: 4 },
    { emoji: "☕", name: "Caféine excessive", category: "health", danger: "low", unit: "cafés/jour", defaultQty: 5 },
    { emoji: "🍬", name: "Sucre / Sucreries", category: "health", danger: "low", unit: "fois/jour", defaultQty: 4 },
    { emoji: "🌿", name: "Cannabis", category: "health", danger: "high", unit: "joints/jour", defaultQty: 2 },
    { emoji: "💊", name: "Médicaments non prescrits", category: "health", danger: "high", unit: "prises/jour", defaultQty: 2 },
    { emoji: "🛍", name: "Achats compulsifs", category: "other", danger: "medium", unit: "achats/semaine", defaultQty: 5 },
    { emoji: "🍔", name: "Malbouffe", category: "health", danger: "low", unit: "fois/semaine", defaultQty: 5 },
    { emoji: "👁", name: "Pornographie", category: "mental", danger: "medium", unit: "fois/semaine", defaultQty: 7 },
]

// Messages motivateurs doux avant rechute
const RELAPSE_MOTIVATORS = [
    "Hey, c'est ok. Une rechute ne définit pas ton chemin. Tu as eu le courage de commencer, c'est déjà immense. 💙",
    "Chaque jour que tu as tenu compte. Vraiment. Une rechute, c'est juste une pause — pas un échec. 🌱",
    "Tu n'es pas seul(e) dans cette bataille. Des millions de personnes traversent ça. Tu te relèves, c'est ça qui compte. 💪",
    "Ce n'est pas une faiblesse d'avoir rechuter. C'est humain. Demain est une nouvelle chance. ✨",
    "Ton streak reprend à zéro mais ta force, elle, ne repart jamais de zéro. Tu sais maintenant que tu peux tenir. 🔥",
]

function SoberCounter({ startDate, color }: { startDate: string; color: string }) {
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

// Heatmap style GitHub avec légende mois
function SoberHeatmap({ habitId, color }: { habitId: number; color: string }) {
    const [logs, setLogs] = useState<{ date: string; type: string }[]>([])
    const [open, setOpen] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

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

    // Build 52 semaines (364 jours)
    const weeks: { date: string; type: string | null; dayOfWeek: number }[][] = []
    let currentWeek: { date: string; type: string | null; dayOfWeek: number }[] = []

    for (let i = 363; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split("T")[0]
        const dow = d.getDay() // 0=dim
        if (dow === 1 && currentWeek.length > 0) {
            weeks.push(currentWeek)
            currentWeek = []
        }
        currentWeek.push({ date: key, type: logMap[key] ?? null, dayOfWeek: dow })
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)

    // Génère les labels de mois
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
        const firstDay = week[0]
        if (firstDay) {
            const m = new Date(firstDay.date).getMonth()
            if (m !== lastMonth) {
                monthLabels.push({ label: new Date(firstDay.date).toLocaleDateString("fr-FR", { month: "short" }), col: wi })
                lastMonth = m
            }
        }
    })

    function getCellColor(type: string | null): string {
        if (type === "success") return color
        if (type === "relapse") return "#ef4444"
        return "rgba(255,255,255,0.06)"
    }

    const totalSuccess = logs.filter(l => l.type === "success").length
    const totalRelapse = logs.filter(l => l.type === "relapse").length

    return (
        <div className="sober-heatmap-wrapper">
            <button className="habit-heatmap-toggle" onClick={handleOpen}>
                {open ? "▲ Masquer le calendrier de sobriété" : "▼ Voir le calendrier de sobriété"}
            </button>
            {open && (
                <div className="sober-heatmap-container">
                    {/* Stats rapides */}
                    <div className="sober-heatmap-stats">
                        <span style={{ color: "#22c55e" }}>✅ {totalSuccess} jours réussis</span>
                        <span style={{ color: "#ef4444" }}>↩ {totalRelapse} rechutes</span>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>sur 52 semaines</span>
                    </div>

                    {/* Labels mois */}
                    <div className="sober-heatmap-months" style={{ gridTemplateColumns: `repeat(${weeks.length}, 14px)` }}>
                        {monthLabels.map((m, i) => (
                            <span key={i} className="sober-heatmap-month" style={{ gridColumn: m.col + 1 }}>{m.label}</span>
                        ))}
                    </div>

                    {/* Labels jours */}
                    <div className="sober-heatmap-body">
                        <div className="sober-heatmap-days">
                            <span>Lun</span>
                            <span></span>
                            <span>Mer</span>
                            <span></span>
                            <span>Ven</span>
                            <span></span>
                            <span>Dim</span>
                        </div>

                        {/* Grid des semaines */}
                        <div className="sober-heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks.length}, 14px)` }}>
                            {weeks.map((week, wi) =>
                                [1, 2, 3, 4, 5, 6, 0].map(dow => {
                                    const day = week.find(d => d.dayOfWeek === dow)
                                    return (
                                        <div
                                            key={`${wi}-${dow}`}
                                            className="sober-heatmap-cell"
                                            style={{
                                                background: day ? getCellColor(day.type) : "transparent",
                                                opacity: day ? 1 : 0,
                                                boxShadow: day?.type === "success" ? `0 0 4px ${color}66` : undefined,
                                            }}
                                            title={day ? `${day.date}${day.type === "success" ? " — ✅ Jour propre" : day.type === "relapse" ? " — ↩ Rechute" : ""}` : ""}
                                            onMouseEnter={e => {
                                                if (day?.type) {
                                                    const rect = (e.target as HTMLElement).getBoundingClientRect()
                                                    setTooltip({
                                                        text: `${day.date} — ${day.type === "success" ? "✅ Jour propre" : "↩ Rechute"}`,
                                                        x: rect.left,
                                                        y: rect.top - 30,
                                                    })
                                                }
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Légende */}
                    <div className="sober-heatmap-legend">
                        <span className="legend-less">Moins</span>
                        <div className="legend-cell" style={{ background: "rgba(255,255,255,0.06)" }} />
                        <div className="legend-cell" style={{ background: `${color}44` }} />
                        <div className="legend-cell" style={{ background: `${color}88` }} />
                        <div className="legend-cell" style={{ background: color }} />
                        <span className="legend-more">Plus</span>
                        <div style={{ marginLeft: 12, display: "flex", alignItems: "center", gap: 4 }}>
                            <div className="legend-cell" style={{ background: "#ef4444" }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Rechute</span>
                        </div>
                    </div>

                    {tooltip && (
                        <div className="heatmap-tooltip" style={{ top: tooltip.y, left: tooltip.x }}>{tooltip.text}</div>
                    )}
                </div>
            )}
        </div>
    )
}

// Tracker de consommation quotidienne avec réduction valorisée
function DailyConsumptionTracker({
                                     habit,
                                     onLogConsumption,
                                 }: {
    habit: Habit
    onLogConsumption: (habitId: number, count: number) => void
}) {
    const [todayCount, setTodayCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const baseline = (habit as Habit & { baseline_qty?: number }).baseline_qty ?? habit.times_per_day ?? 5
    const unit = (habit as Habit & { unit?: string }).unit ?? "fois"

    const reduction = baseline - todayCount
    const pct = Math.max(0, Math.min(100, (reduction / baseline) * 100))

    function getMotivationMsg(): { msg: string; color: string } {
        if (todayCount === 0) return { msg: "🌟 Incroyable ! Zéro aujourd'hui. Tu es une force !", color: "#22c55e" }
        if (todayCount < baseline * 0.25) return { msg: `💪 Impressionnant ! ${reduction} de moins que d'habitude. Tu avances !`, color: "#6366f1" }
        if (todayCount < baseline * 0.5) return { msg: `✨ Bien joué ! ${reduction} en moins, c'est déjà une belle victoire.`, color: "#3b82f6" }
        if (todayCount < baseline) return { msg: `👏 Tu en as fait ${reduction} de moins qu'avant. Chaque réduction compte !`, color: "#f59e0b" }
        if (todayCount === baseline) return { msg: `Comme d'habitude aujourd'hui. Demain, essaie d'en faire un de moins 🌱`, color: "rgba(255,255,255,0.5)" }
        return { msg: `C'est ok. Tu remarques et tu tracked, c'est déjà courageux. 💙`, color: "#a855f7" }
    }

    const { msg, color: msgColor } = getMotivationMsg()

    return (
        <div className="consumption-tracker">
            <button className="consumption-toggle" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? "▲" : "▼"} Suivi de consommation aujourd'hui
            </button>
            {isOpen && (
                <div className="consumption-body">
                    <p className="consumption-baseline">
                        Avant : <strong>{baseline} {unit}/jour</strong> — Objectif : <strong>0</strong> 🎯
                    </p>

                    <div className="consumption-counter-row">
                        <button className="consumption-btn minus" onClick={() => setTodayCount(Math.max(0, todayCount - 1))}>−</button>
                        <div className="consumption-display">
                            <span className="consumption-number">{todayCount}</span>
                            <span className="consumption-unit">{unit} aujourd'hui</span>
                        </div>
                        <button className="consumption-btn plus" onClick={() => setTodayCount(todayCount + 1)}>+</button>
                    </div>

                    {/* Barre de progression réduction */}
                    <div className="consumption-progress-wrapper">
                        <div className="consumption-progress-track">
                            <div
                                className="consumption-progress-fill"
                                style={{ width: `${pct}%`, background: todayCount === 0 ? "#22c55e" : habit.color }}
                            />
                        </div>
                        <span className="consumption-pct">{Math.round(pct)}% de réduction</span>
                    </div>

                    <p className="consumption-motivation" style={{ color: msgColor }}>{msg}</p>

                    <button
                        className="consumption-log-btn"
                        onClick={() => { onLogConsumption(habit.id, todayCount); setIsOpen(false) }}
                    >
                        💾 Enregistrer
                    </button>
                </div>
            )}
        </div>
    )
}

// Formulaire de rechute avec motivateur
function RelapseForm({
                         habit,
                         relapseNote,
                         setRelapseNote,
                         onConfirm,
                         onCancel,
                     }: {
    habit: Habit
    relapseNote: string
    setRelapseNote: (v: string) => void
    onConfirm: () => void
    onCancel: () => void
}) {
    const [motivator] = useState(() => RELAPSE_MOTIVATORS[Math.floor(Math.random() * RELAPSE_MOTIVATORS.length)])
    const [confirmed, setConfirmed] = useState(false)

    return (
        <div className="relapse-form enhanced">
            {/* Motivateur bienveillant */}
            <div className="relapse-motivator">
                <div className="relapse-motivator-icon">💙</div>
                <p className="relapse-motivator-text">{motivator}</p>
                <p className="relapse-streak-reminder">
                    Tu as tenu <strong>{habit.streak} jours</strong> — ça, personne ne peut te l'enlever.
                </p>
            </div>

            {!confirmed ? (
                <div className="relapse-confirm-step">
                    <p className="relapse-confirm-question">Tu veux vraiment enregistrer une rechute ?</p>
                    <div className="relapse-form-actions">
                        <button className="habit-btn relapse-confirm" onClick={() => setConfirmed(true)}>
                            Oui, c'est arrivé
                        </button>
                        <button className="habit-btn success" onClick={onCancel}>
                            Non, j'ai tenu 💪
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relapse-note-step">
                    <label className="theme-label" style={{ marginBottom: 6, display: "block" }}>
                        Qu'est-ce qui s'est passé ? <span style={{ opacity: 0.5 }}>(optionnel — ça aide à comprendre)</span>
                    </label>
                    <textarea
                        className="theme-input relapse-textarea"
                        placeholder="Ex: j'étais stressé, j'avais une soirée... Pas de jugement ici."
                        value={relapseNote}
                        onChange={e => setRelapseNote(e.target.value)}
                        rows={3}
                    />
                    <div className="relapse-form-actions">
                        <button className="habit-btn relapse-confirm" onClick={onConfirm}>Confirmer la rechute</button>
                        <button className="habit-btn" onClick={onCancel}>Annuler</button>
                    </div>
                    <p className="relapse-tip">💡 Astuce : note tes déclencheurs, ça aide à les anticiper la prochaine fois.</p>
                </div>
            )}
        </div>
    )
}

// Habit heatmap standard (pour les bonnes habitudes)
function HabitHeatmap({ habitId }: { habitId: number }) {
    const [logs, setLogs] = useState<{ date: string; type: string }[]>([])
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
                            <div
                                key={day.date}
                                className="habit-heatmap-cell"
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
        themes, themeIds, toggleThemeSelection,
        showForm, setShowForm,
        relapseHabitId, setRelapseHabitId,
        relapseNote, setRelapseNote,
        lastXp,
        name, setName,
        type, setType,
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

    // State pour les suggestions d'addictions
    const [showSuggestions, setShowSuggestions] = useState(false)
    // State pour le baseline qty par addiction
    const [baselineQty, setBaselineQty] = useState(5)
    const [baselineUnit, setBaselineUnit] = useState("fois/jour")

    function applySuggestion(s: typeof ADDICTION_SUGGESTIONS[0]) {
        setName(s.name)
        setEmoji(s.emoji)
        setDangerLevel(s.danger)
        setBaselineQty(s.defaultQty)
        setBaselineUnit(s.unit)
        setShowSuggestions(false)
        setType("quit")
    }

    // Handler fictif pour log de consommation (à connecter à l'API)
    function handleLogConsumption(habitId: number, count: number) {
        console.log(`Log consommation habitude ${habitId}: ${count}`)
        // TODO: appeler l'API
    }

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
                    <div className="nav-item" onClick={() => navigate("/historique")}>Historique</div>
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

                            {/* Suggestions d'addictions connues */}
                            {type === "quit" && (
                                <div className="addiction-suggestions-block">
                                    <button className="suggestions-toggle" onClick={() => setShowSuggestions(!showSuggestions)}>
                                        ✨ Choisir parmi les addictions connues {showSuggestions ? "▲" : "▼"}
                                    </button>
                                    {showSuggestions && (
                                        <div className="suggestions-grid">
                                            {ADDICTION_SUGGESTIONS.map((s, i) => (
                                                <button key={i} className="suggestion-pill" onClick={() => applySuggestion(s)}>
                                                    <span className="suggestion-emoji">{s.emoji}</span>
                                                    <span className="suggestion-name">{s.name}</span>
                                                    <span className={`suggestion-danger ${s.danger}`}>
                                                        {s.danger === "high" ? "🔴" : s.danger === "medium" ? "🟡" : "🟢"}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="theme-field">
                                <label className="theme-label">Nom</label>
                                <input className="theme-input" placeholder="Ex: Méditation quotidienne..." value={name} onChange={e => setName(e.target.value)} />
                            </div>

                            {/* SÉLECTEUR MULTI-THÈMES */}
                            <div className="theme-field">
                                <label className="theme-label">
                                    Thèmes <span className="theme-label-hint">(3 max)</span>
                                </label>
                                <div className="theme-multi-picker">
                                    {themes.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`theme-multi-btn ${themeIds.includes(t.id) ? "selected" : ""}`}
                                            style={{
                                                borderColor: themeIds.includes(t.id) ? t.color : "rgba(255,255,255,0.1)",
                                                background: themeIds.includes(t.id) ? `${t.color}22` : "transparent",
                                                color: themeIds.includes(t.id) ? t.color : "rgba(255,255,255,0.6)",
                                            }}
                                            onClick={() => toggleThemeSelection(t.id)}
                                            disabled={!themeIds.includes(t.id) && themeIds.length >= 3}
                                        >
                                            {t.emoji} {t.name}
                                            {themeIds.includes(t.id) && <span> ✓</span>}
                                        </button>
                                    ))}
                                </div>
                                {themeIds.length === 3 && (
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                                        Maximum 3 thèmes atteint
                                    </p>
                                )}
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
                                    {/* Quantité de base — clé pour valoriser la réduction */}
                                    <div className="habit-form-row">
                                        <div className="theme-field">
                                            <label className="theme-label">
                                                Tu en faisais combien ? <span className="theme-label-hint">(avant de commencer)</span>
                                            </label>
                                            <input
                                                className="theme-input"
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={baselineQty}
                                                onChange={e => setBaselineQty(Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="theme-field">
                                            <label className="theme-label">Unité</label>
                                            <input
                                                className="theme-input"
                                                placeholder="cigarettes/jour, verres/jour..."
                                                value={baselineUnit}
                                                onChange={e => setBaselineUnit(e.target.value)}
                                            />
                                        </div>
                                    </div>

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
                                        {habit.times_per_day > 1 ? `+ Faire (${habit.todayCount}/${habit.times_per_day})` : "✓ Fait aujourd'hui"}

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
                            <p>Aucune addiction trackée — tu peux en ajouter une ci-dessus.</p>
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

                            {/* Milestone progress */}
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

                            {/* Sober counter */}
                            {habit.start_date && <SoberCounter startDate={habit.start_date} color={habit.color} />}

                            {/* Heatmap style GitHub amélioré */}
                            <SoberHeatmap habitId={habit.id} color={habit.color} />

                            {/* Tracker consommation quotidienne */}
                            <DailyConsumptionTracker habit={habit} onLogConsumption={handleLogConsumption} />

                            {/* Infos contextuelles */}
                            <div className="habit-info-grid">
                                {habit.triggers && <p className="habit-info-item">⚡ <strong>Déclencheurs :</strong> {habit.triggers}</p>}
                                {habit.relapse_plan && <p className="habit-info-item">🛡 <strong>Plan :</strong> {habit.relapse_plan}</p>}
                                {habit.lastRelapse && <p className="habit-info-item">📅 <strong>Dernière rechute :</strong> {new Date(habit.lastRelapse).toLocaleDateString()}</p>}
                            </div>

                            <div className="habit-stats-row">
                                <div className="habit-stat-pill">✅ {habit.totalSuccess} jours réussis</div>
                                <div className="habit-stat-pill danger">↩ {habit.relapseCount} rechutes</div>
                            </div>

                            {/* Formulaire de rechute amélioré avec motivateur */}
                            {relapseHabitId === habit.id ? (
                                <RelapseForm
                                    habit={habit}
                                    relapseNote={relapseNote}
                                    setRelapseNote={setRelapseNote}
                                    onConfirm={() => handleRelapse(habit.id)}
                                    onCancel={() => setRelapseHabitId(null)}
                                />
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