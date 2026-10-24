import "../assets/css/stats.css"
import { useEffect, useState } from "react"
import Navbar from "../components/Navbar";
import { useStats } from "../services/Stats"
import type { HeatmapPeriod } from "../services/Stats"
import {
    BarChart, Bar, Line, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PieChart, Pie, Cell,
    ComposedChart,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, LineChart
} from "recharts"

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]

type Period = "week" | "month" | "year"

type ChartColors = {
    tasks: string
    xp: string
    xpCumulative: string
    focus: string
    radarTasks: string
    radarCompleted: string
    heatmap: string
    priorityLow: string
    priorityMedium: string
    priorityHigh: string
}

const DEFAULT_CHART_COLORS: ChartColors = {
    tasks: "#6366f1",
    xp: "#6366f1",
    xpCumulative: "#a855f7",
    focus: "#22d3ee",
    radarTasks: "#6366f1",
    radarCompleted: "#a855f7",
    heatmap: "#6366f1",
    priorityLow: "#22c55e",
    priorityMedium: "#f59e0b",
    priorityHigh: "#ef4444",
}

const COLOR_CONTROL_LABELS: { key: keyof ChartColors; label: string }[] = [
    { key: "tasks", label: "Tâches" },
    { key: "xp", label: "XP quotidien" },
    { key: "xpCumulative", label: "XP cumulé" },
    { key: "focus", label: "Temps de focus" },
    { key: "radarTasks", label: "Radar · activités" },
    { key: "radarCompleted", label: "Radar · complétées" },
    { key: "heatmap", label: "Carte d’activité" },
    { key: "priorityLow", label: "Priorité basse" },
    { key: "priorityMedium", label: "Priorité moyenne" },
    { key: "priorityHigh", label: "Priorité haute" },
]

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

function XpChart({ data, period, colors }: { data: { period: string; xp: number }[]; period: Period; colors: ChartColors }) {
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
                    tick={{ fill: "var(--stats-axis)", fontSize: 11 }}
                    tickFormatter={d => formatXpLabel(d, period)}
                    interval="preserveStartEnd"
                />
                <YAxis
                    yAxisId="daily"
                    tick={{ fill: "var(--stats-axis)", fontSize: 11 }}
                    width={36}
                />
                <YAxis
                    yAxisId="cumul"
                    orientation="right"
                    tick={{ fill: colors.xpCumulative, fontSize: 11 }}
                    width={40}
                />
                <Tooltip
                    contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }}
                    labelStyle={{ color: "var(--stats-tooltip-text)", marginBottom: 4 }}
                    labelFormatter={d => formatXpLabel(d, period)}
                    formatter={(value, name) => [
                        `${Number(value).toLocaleString()} XP`,
                        name === "xp" ? "Ce jour" : "Cumulé"
                    ]}
                />
                <Legend
                    formatter={v => v === "xp" ? "XP du jour" : "XP cumulé"}
                    wrapperStyle={{ fontSize: 11, color: "var(--stats-muted)" }}
                />
                <Bar
                    yAxisId="daily"
                    dataKey="xp"
                    fill={colors.xp}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={24}
                    opacity={0.85}
                />
                <Line
                    yAxisId="cumul"
                    type="monotone"
                    dataKey="xpCumul"
                    stroke={colors.xpCumulative}
                    strokeWidth={2}
                    dot={false}
                />
            </ComposedChart>
        </ResponsiveContainer>
    )
}

export default function Stats() {

    const {
        loading,
        hasLoadError,
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

    const [chartColors, setChartColors] = useState<ChartColors>(() => {
        if (typeof window === "undefined") return DEFAULT_CHART_COLORS
        try {
            const saved = window.localStorage.getItem("grindly-stats-colors")
            if (!saved) return DEFAULT_CHART_COLORS
            const parsed = JSON.parse(saved) as Partial<ChartColors>
            const safeColors = { ...DEFAULT_CHART_COLORS }
            ;(Object.keys(DEFAULT_CHART_COLORS) as (keyof ChartColors)[]).forEach(key => {
                const value = parsed[key]
                if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)) {
                    safeColors[key] = value
                }
            })
            return safeColors
        } catch {
            return DEFAULT_CHART_COLORS
        }
    })
    const [taskChartType, setTaskChartType] = useState<"bar" | "line">(() => {
        try {
            return typeof window !== "undefined" && window.localStorage.getItem("grindly-stats-task-chart-type") === "line" ? "line" : "bar"
        } catch {
            return "bar"
        }
    })
    const [focusChartType, setFocusChartType] = useState<"bar" | "line">(() => {
        try {
            return typeof window !== "undefined" && window.localStorage.getItem("grindly-stats-focus-chart-type") === "line" ? "line" : "bar"
        } catch {
            return "bar"
        }
    })

    useEffect(() => {
        try {
            window.localStorage.setItem("grindly-stats-colors", JSON.stringify(chartColors))
        } catch (err) {
            console.warn("Impossible de sauvegarder les couleurs des graphiques.", err)
        }
    }, [chartColors])

    useEffect(() => {
        try {
            window.localStorage.setItem("grindly-stats-task-chart-type", taskChartType)
            window.localStorage.setItem("grindly-stats-focus-chart-type", focusChartType)
        } catch (err) {
            console.warn("Impossible de sauvegarder le type des graphiques.", err)
        }
    }, [taskChartType, focusChartType])

    const updateChartColor = (key: keyof ChartColors, color: string) => {
        if (/^#[0-9a-f]{6}$/i.test(color)) {
            setChartColors(previous => ({ ...previous, [key]: color }))
        }
    }

    const resetChartColors = () => setChartColors(DEFAULT_CHART_COLORS)
    const priorityColor = (priority: string) => {
        if (priority.toLowerCase() === "low" || priority.toLowerCase() === "basse") return chartColors.priorityLow
        if (priority.toLowerCase() === "medium" || priority.toLowerCase() === "moyenne") return chartColors.priorityMedium
        if (priority.toLowerCase() === "high" || priority.toLowerCase() === "haute") return chartColors.priorityHigh
        return chartColors.tasks
    }
    const priorityLabel = (priority: string) => {
        const normalized = priority.toLowerCase()
        if (normalized === "low" || normalized === "basse") return "Basse"
        if (normalized === "medium" || normalized === "moyenne") return "Moyenne"
        if (normalized === "high" || normalized === "haute") return "Haute"
        return priority
    }
    const currentDate = new Date()
    const maxHeatmapDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`

    if (loading) return <div className="stats-page"><Navbar /><main className="stats-main"><div className="stats-loading"><span className="stats-loading-orbit" />Préparation de tes statistiques…</div></main></div>

    const heatmapDays = getHeatmapDays()

    return (
        <div className="stats-page">

            <Navbar />

            <main className="stats-main">

                <section className="stats-hero">
                    <div>
                        <p className="stats-eyebrow">TON ÉVOLUTION EN UN COUP D’ŒIL</p>
                        <h1 className="stats-title">Tes statistiques<span>.</span></h1>
                        <p className="stats-intro">Visualise tes habitudes, tes efforts et tes progrès. Les couleurs restent enregistrées sur cet appareil.</p>
                    </div>
                    <div className="stats-hero-orb" aria-hidden="true">↗</div>
                </section>

                {hasLoadError && (
                    <div className="stats-warning" role="status">
                        <span aria-hidden="true">!</span>
                        Certaines données n’ont pas pu être chargées. Les graphiques concernés affichent les données disponibles ; actualise la page pour réessayer.
                    </div>
                )}

                <details className="stats-customization">
                    <summary><span className="stats-customization-icon" aria-hidden="true">◉</span><span><strong>Personnaliser les graphiques</strong><small>Choisis les couleurs de chaque série · enregistrées automatiquement</small></span><span className="stats-customization-chevron" aria-hidden="true">⌄</span></summary>
                    <div className="stats-color-controls">
                        {COLOR_CONTROL_LABELS.map(control => (
                            <label key={control.key} className="stats-color-control">
                                <span className="stats-color-swatch" style={{ background: chartColors[control.key] }} />
                                <span>{control.label}</span>
                                <input type="color" value={chartColors[control.key]} aria-label={`Couleur : ${control.label}`} onChange={event => updateChartColor(control.key, event.target.value)} />
                                <code>{chartColors[control.key].toUpperCase()}</code>
                            </label>
                        ))}
                    </div>
                    <div className="stats-customization-footer">
                        <span>Les couleurs sont sauvegardées dans ton navigateur.</span>
                        <button type="button" className="stats-reset-colors" onClick={resetChartColors}>Rétablir les couleurs</button>
                    </div>
                </details>

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
                                max={maxHeatmapDate}
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
                                        background: getHeatmapColor(day.count, chartColors.heatmap),
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
                            <div key={v} className="heatmap-cell" style={{ background: getHeatmapColor(v, chartColors.heatmap) }} />
                        ))}
                        <span>Plus</span>
                    </div>
                </div>

                <div className="stats-grid">

                    {/* TÂCHES PAR JOUR */}
                    <div className="stats-section stats-chart-section">
                        <div className="stats-chart-heading">
                            <h2 className="stats-section-title">Tâches complétées</h2>
                            <div className="stats-chart-switch" role="group" aria-label="Type de graphique des tâches">
                                <button type="button" className={taskChartType === "bar" ? "active" : ""} aria-pressed={taskChartType === "bar"} onClick={() => setTaskChartType("bar")}>Barres</button>
                                <button type="button" className={taskChartType === "line" ? "active" : ""} aria-pressed={taskChartType === "line"} onClick={() => setTaskChartType("line")}>Courbe</button>
                            </div>
                        </div>
                        {tasksPerDay.some(item => item.count > 0) ? (
                            <ResponsiveContainer width="100%" height={240}>
                                {taskChartType === "bar" ? (
                                    <BarChart data={tasksPerDay} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <CartesianGrid stroke="var(--stats-grid)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: "var(--stats-axis)", fontSize: 10 }} tickFormatter={date => String(date).slice(5)} tickLine={false} axisLine={false} minTickGap={15} />
                                        <YAxis tick={{ fill: "var(--stats-axis)", fontSize: 10 }} allowDecimals={false} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }} labelStyle={{ color: "var(--stats-tooltip-text)" }} formatter={value => [Number(value) || 0, "Tâches"]} />
                                        <Bar dataKey="count" name="Tâches" fill={chartColors.tasks} radius={[5, 5, 0, 0]} maxBarSize={32} />
                                    </BarChart>
                                ) : (
                                    <LineChart data={tasksPerDay} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <CartesianGrid stroke="var(--stats-grid)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: "var(--stats-axis)", fontSize: 10 }} tickFormatter={date => String(date).slice(5)} tickLine={false} axisLine={false} minTickGap={15} />
                                        <YAxis tick={{ fill: "var(--stats-axis)", fontSize: 10 }} allowDecimals={false} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }} labelStyle={{ color: "var(--stats-tooltip-text)" }} formatter={value => [Number(value) || 0, "Tâches"]} />
                                        <Line dataKey="count" name="Tâches" type="monotone" stroke={chartColors.tasks} strokeWidth={3} dot={{ r: 2, fill: chartColors.tasks }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <div className="stats-empty-state"><span className="stats-empty-icon">✓</span><span>Pas encore de tâche complétée sur cette période</span><span className="stats-empty-hint">Les données apparaîtront dès tes premières validations.</span></div>
                        )}
                    </div>

                    {/* XP OVER TIME — ComposedChart barres + courbe cumulative */}
                    <div className="stats-section">
                        <h2 className="stats-section-title">XP gagnés</h2>
                        <XpChart data={xpOverTime} period={period} colors={chartColors} />
                    </div>

                    {/* FOCUS PAR JOUR */}
                    <div className="stats-section stats-chart-section">
                        <div className="stats-chart-heading">
                            <h2 className="stats-section-title">Temps de focus</h2>
                            <div className="stats-chart-switch" role="group" aria-label="Type de graphique du focus">
                                <button type="button" className={focusChartType === "bar" ? "active" : ""} aria-pressed={focusChartType === "bar"} onClick={() => setFocusChartType("bar")}>Barres</button>
                                <button type="button" className={focusChartType === "line" ? "active" : ""} aria-pressed={focusChartType === "line"} onClick={() => setFocusChartType("line")}>Courbe</button>
                            </div>
                        </div>
                        {focusPerDay.some(item => item.minutes > 0) ? (
                            <ResponsiveContainer width="100%" height={240}>
                                {focusChartType === "bar" ? (
                                    <BarChart data={focusPerDay} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <CartesianGrid stroke="var(--stats-grid)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: "var(--stats-axis)", fontSize: 10 }} tickFormatter={date => String(date).slice(5)} tickLine={false} axisLine={false} minTickGap={15} />
                                        <YAxis tick={{ fill: "var(--stats-axis)", fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }} labelStyle={{ color: "var(--stats-tooltip-text)" }} formatter={value => [`${Number(value) || 0} min`, "Focus"]} />
                                        <Bar dataKey="minutes" name="Focus" fill={chartColors.focus} radius={[5, 5, 0, 0]} maxBarSize={32} />
                                    </BarChart>
                                ) : (
                                    <LineChart data={focusPerDay} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <CartesianGrid stroke="var(--stats-grid)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fill: "var(--stats-axis)", fontSize: 10 }} tickFormatter={date => String(date).slice(5)} tickLine={false} axisLine={false} minTickGap={15} />
                                        <YAxis tick={{ fill: "var(--stats-axis)", fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }} labelStyle={{ color: "var(--stats-tooltip-text)" }} formatter={value => [`${Number(value) || 0} min`, "Focus"]} />
                                        <Line dataKey="minutes" name="Focus" type="monotone" stroke={chartColors.focus} strokeWidth={3} dot={{ r: 2, fill: chartColors.focus }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        ) : (
                            <div className="stats-empty-state"><span className="stats-empty-icon">◷</span><span>Aucune session de focus sur cette période</span><span className="stats-empty-hint">Lance une session Flow pour voir ta courbe de concentration.</span></div>
                        )}
                    </div>

                    {/* PRIORITÉ SPLIT */}
                    <div className="stats-section">
                        <h2 className="stats-section-title">Répartition des priorités</h2>
                        {prioritySplit.some(item => item.count > 0) ? (
                            <>
                                <ResponsiveContainer width="100%" height={210}>
                                    <PieChart>
                                        <Pie data={prioritySplit.filter(item => item.count > 0)} dataKey="count" nameKey="priority" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3}>
                                            {prioritySplit.filter(item => item.count > 0).map(entry => (
                                                <Cell key={entry.priority} fill={priorityColor(entry.priority)} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }} labelStyle={{ color: "var(--stats-tooltip-text)" }} formatter={value => [Number(value) || 0, "Complétions"]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="priority-legend">
                                    {prioritySplit.filter(item => item.count > 0).map(item => (
                                        <div key={item.priority} className="priority-legend-item">
                                            <div className="priority-legend-dot" style={{ background: priorityColor(item.priority) }} />
                                            <span>{priorityLabel(item.priority)}</span>
                                            <span className="priority-legend-count">{item.count.toLocaleString("fr-FR")}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="stats-empty-state"><span className="stats-empty-icon">◉</span><span>Aucune tâche terminée pour répartir les priorités</span></div>
                        )}
                    </div>

                </div>

                {/* RADAR */}
                <div className="stats-section">
                    <h2 className="stats-section-title">Performance par thème</h2>
                    {radarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="var(--stats-grid)" />
                                <PolarAngleAxis dataKey="theme" tick={{ fill: "var(--stats-axis)", fontSize: 11 }} />
                                <Radar name="Activités prévues" dataKey="tasks" stroke={chartColors.radarTasks} fill={chartColors.radarTasks} fillOpacity={0.24} />
                                <Radar name="Activités réalisées" dataKey="completed" stroke={chartColors.radarCompleted} fill={chartColors.radarCompleted} fillOpacity={0.24} />
                                <Tooltip contentStyle={{ background: "var(--stats-tooltip-bg)", color: "var(--stats-tooltip-text)", border: "1px solid var(--stats-border)", borderRadius: 10 }} labelStyle={{ color: "var(--stats-tooltip-text)" }} />
                                <Legend wrapperStyle={{ fontSize: 11, color: "var(--stats-muted)" }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="stats-empty-state"><span className="stats-empty-icon">⌘</span><span>Pas encore de thèmes à comparer</span><span className="stats-empty-hint">Crée des thèmes et associe-leur des tâches ou des habitudes.</span></div>
                    )}
                </div>

            </main>

        </div>
    )
}