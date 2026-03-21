import "../assets/css/stats.css"
import { useStats } from "../services/Stats"
import type { HeatmapPeriod } from "../services/Stats"
import {
    BarChart, Bar, LineChart, Line, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
    ComposedChart,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const PRIORITY_COLORS = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444"
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]

type Period = "week" | "month" | "year"

function formatXpLabel(period: string, p: Period): string {
    if (p === "year") {
        const [, month] = period.split("-")
        return MONTHS[parseInt(month) - 1] ?? period
    }
    const parts = period.split("-")
    return `${parts[2]}/${parts[1]}`
}

function enrichXp(data: { period: string; xp: number }[]) {
    let cumul = 0
    return data.map(d => {
        cumul += Number(d.xp)
        return { ...d, xp: Number(d.xp), xpCumul: cumul }
    })
}

function XpChart({ data, period }: { data: { period: string; xp: number }[]; period: Period }) {
    const enriched = enrichXp(data)
    const hasData = enriched.some(d => d.xp > 0)

    if (!hasData) {
        return (
            <div className="stats-empty-state">
                <span className="stats-empty-icon">⚡</span>
                <span>Aucun XP enregistré sur cette période</span>
                <span className="stats-empty-hint">Complète des tâches, sessions Flow ou habitudes</span>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={enriched} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                    dataKey="period"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    tickFormatter={d => formatXpLabel(d, period)}
                    interval="preserveStartEnd"
                />
                <YAxis
                    yAxisId="daily"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    width={36}
                />
                <YAxis
                    yAxisId="cumul"
                    orientation="right"
                    tick={{ fill: "rgba(168,85,247,0.45)", fontSize: 11 }}
                    width={40}
                />
                <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)", marginBottom: 4 }}
                    labelFormatter={d => formatXpLabel(d, period)}
                    formatter={(value: number, name: string) => [
                        `${Number(value).toLocaleString()} XP`,
                        name === "xp" ? "Ce jour" : "Cumulé"
                    ]}
                />
                <Legend
                    formatter={v => v === "xp" ? "XP du jour" : "XP cumulé"}
                    wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}
                />
                <Bar
                    yAxisId="daily"
                    dataKey="xp"
                    fill="#6366f1"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={24}
                    opacity={0.85}
                />
                <Line
                    yAxisId="cumul"
                    type="monotone"
                    dataKey="xpCumul"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                />
            </ComposedChart>
        </ResponsiveContainer>
    )
}

export default function Stats() {

    const {
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
    } = useStats()

    if (loading) return <div className="stats-page">Loading...</div>

    const heatmapDays = getHeatmapDays()

    return (
        <div className="stats-page">

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

            <main className="stats-main">

                <h1 className="stats-title">Statistiques</h1>

                {/* PERIOD SELECTOR */}
                <div className="stats-period">
                    {(["week", "month", "year"] as const).map(p => (
                        <button
                            key={p}
                            className={`period-btn ${period === p ? "active" : ""}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p === "week" ? "Semaine" : p === "month" ? "Mois" : "Année"}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW CARDS */}
                <div className="stats-overview">
                    <div className="stats-card">
                        <span className="stats-card-value">{overview.totalTasks}</span>
                        <span className="stats-card-label">Tâches complétées</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-card-value">{overview.totalXp.toLocaleString()}</span>
                        <span className="stats-card-label">XP total</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-card-value">{Math.round(overview.totalFocus / 60)}h</span>
                        <span className="stats-card-label">Focus total</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-card-value">{overview.bestStreak} 🔥</span>
                        <span className="stats-card-label">Meilleur streak</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-card-value">{overview.bestDay}</span>
                        <span className="stats-card-label">Meilleur jour</span>
                    </div>
                    <div className="stats-card">
                        <span className="stats-card-value">{formatHour(overview.bestHour)}</span>
                        <span className="stats-card-label">Heure productive</span>
                    </div>
                </div>

                {/* HEATMAP */}
                <div className="stats-section">
                    <div className="heatmap-header">
                        <h2 className="stats-section-title">📅 Activité</h2>
                        <div className="heatmap-filters">
                            {([
                                { value: "week", label: "7 jours" },
                                { value: "month", label: "30 jours" },
                                { value: "3months", label: "3 mois" },
                                { value: "6months", label: "6 mois" },
                                { value: "365", label: "1 an" },
                                { value: "all", label: "Tout" },
                            ] as { value: HeatmapPeriod, label: string }[]).map(p => (
                                <button
                                    key={p.value}
                                    className={`period-btn ${heatmapPeriod === p.value && !heatmapFrom ? "active" : ""}`}
                                    onClick={() => { setHeatmapPeriod(p.value); setHeatmapFrom("") }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="heatmap-date-picker">
                            <label className="flow-label">Depuis :</label>
                            <input
                                type="date"
                                className="theme-input"
                                value={heatmapFrom}
                                onChange={e => setHeatmapFrom(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="heatmap-wrapper">
                        <div className="heatmap-day-labels">
                            {DAY_LABELS.map(d => (
                                <span key={d} className="heatmap-day-label">{d}</span>
                            ))}
                        </div>
                        <div className="heatmap">
                            {heatmapDays.map(day => (
                                <div
                                    key={day.date}
                                    className="heatmap-cell"
                                    style={{
                                        background: getHeatmapColor(day.count),
                                        gridRow: day.dayOfWeek + 1
                                    }}
                                    title={`${day.date} — ${day.count} tâche${day.count > 1 ? "s" : ""}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="heatmap-legend">
                        <span>Moins</span>
                        {[0, 2, 4, 6, 8].map(v => (
                            <div key={v} className="heatmap-cell" style={{ background: getHeatmapColor(v) }} />
                        ))}
                        <span>Plus</span>
                    </div>
                </div>

                <div className="stats-grid">

                    {/* TÂCHES PAR JOUR */}
                    <div className="stats-section">
                        <h2 className="stats-section-title">✅ Tâches complétées</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={tasksPerDay}>
                                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "white" }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* XP OVER TIME — ComposedChart barres + courbe cumulative */}
                    <div className="stats-section">
                        <h2 className="stats-section-title">⚡ XP gagnés</h2>
                        <XpChart data={xpOverTime} period={period} />
                    </div>

                    {/* FOCUS PAR JOUR */}
                    <div className="stats-section">
                        <h2 className="stats-section-title">⏱ Temps de focus</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={focusPerDay}>
                                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }}
                                    labelStyle={{ color: "white" }}
                                    formatter={(v) => [`${v ?? 0}min`, "Focus"]}
                                />
                                <Bar dataKey="minutes" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* PRIORITÉ SPLIT */}
                    <div className="stats-section">
                        <h2 className="stats-section-title">🎯 Répartition priorités</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={prioritySplit} dataKey="count" nameKey="priority" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                                    {prioritySplit.map((entry, index) => (
                                        <Cell key={index} fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS] ?? "#6366f1"} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "white" }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="priority-legend">
                            {prioritySplit.map((p, i) => (
                                <div key={i} className="priority-legend-item">
                                    <div className="priority-legend-dot" style={{ background: PRIORITY_COLORS[p.priority as keyof typeof PRIORITY_COLORS] ?? "#6366f1" }} />
                                    <span>{p.priority}</span>
                                    <span className="priority-legend-count">{p.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RADAR */}
                {radarData.length > 0 && (
                    <div className="stats-section">
                        <h2 className="stats-section-title">🕸 Performance par thème</h2>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="theme" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 13 }} />
                                <Radar name="Tâches" dataKey="tasks" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                                <Radar name="Complétées" dataKey="completed" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} labelStyle={{ color: "white" }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}

            </main>

        </div>
    )
}