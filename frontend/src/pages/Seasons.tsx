import { useCallback, useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import "../assets/css/seasons.css"

type SeasonKey = "winter" | "summer"
type SeasonEntry = { rank: number; userId: number; username: string; avatarUrl: string | null; xp: number; actions: number; activeDays: number; division: string; isMe: boolean }
type SeasonResponse = { season: string; seasonKey: SeasonKey; year: number; startsAt: string; endsAt: string; leaderboard: SeasonEntry[]; me: SeasonEntry | null }
const RANKS = [
    { name: "Frozen", min: 0, color: "#9aa6b2" },
    { name: "Frost", min: 500, color: "#9ed9f3" },
    { name: "Blizzard", min: 1500, color: "#7bbce9" },
    { name: "Glacier", min: 3000, color: "#829cf2" },
    { name: "Aurora", min: 5000, color: "#c2a2f5" },
    { name: "Eternal", min: 7500, color: "#f2f5ff" },
]
function getRank(xp: number) { return [...RANKS].reverse().find(rank => xp >= rank.min) || RANKS[0] }
export default function Seasons() {
    const [season, setSeason] = useState<SeasonKey>("winter")
    const [year, setYear] = useState(new Date().getFullYear())
    const [data, setData] = useState<SeasonResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const loadSeason = useCallback(async () => {
        setLoading(true); setError("")
        try {
            const response = await fetch("/api/seasons/" + season + "/" + year, { headers: { Authorization: "Bearer " + (localStorage.getItem("token") || "") } })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || "Impossible de charger cette saison.")
            setData(result as SeasonResponse)
        } catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue.") }
        finally { setLoading(false) }
    }, [season, year])
    useEffect(() => { void loadSeason() }, [loadSeason])
    const dateLabel = (value: string) => new Date(value.replace(" ", "T") + (value.includes("Z") ? "" : "Z")).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    const me = data?.me
    const currentRank = getRank(me?.xp || 0)
    const nextRank = RANKS.find(rank => rank.min > (me?.xp || 0))
    const progress = nextRank ? Math.min(100, Math.round(((me?.xp || 0) - currentRank.min) / (nextRank.min - currentRank.min) * 100)) : 100
    const startFallback = season === "winter" ? year + "-11-01 00:00:00" : year + "-06-01 00:00:00"
    const endFallback = season === "winter" ? (year + 1) + "-02-01 00:00:00" : year + "-09-01 00:00:00"
    return <div className="seasons-page">
        <Navbar />
        <main className="seasons-main">
            <header className={"season-hero " + season}>
                <div className="season-hero-noise" />
                <div className="season-hero-content">
                    <span className="season-eyebrow">GRINDLY · SEASONAL CHALLENGES</span>
                    <h1>{season === "winter" ? "Winter Arc" : "Summer Arc"}</h1>
                    <p>{season === "winter" ? "Une saison pour construire ta discipline, dans le calme et la constance." : "Une saison pour passer à l'action, progresser et récolter les résultats."}</p>
                    <div className="season-dates">{season === "winter" ? "❄" : "☀"} {dateLabel(data?.startsAt || startFallback)} — {dateLabel(data?.endsAt || endFallback)}</div>
                </div>
                <div className="season-hero-mark" aria-hidden="true">{season === "winter" ? "❄" : "☀"}</div>
            </header>
            <div className="season-switch-row">
                <div className="season-switch" role="tablist" aria-label="Choisir une saison">
                    <button className={season === "winter" ? "active winter" : ""} onClick={() => setSeason("winter")}>❄ Winter Arc</button>
                    <button className={season === "summer" ? "active summer" : ""} onClick={() => setSeason("summer")}>☀ Summer Arc</button>
                </div>
                <div className="season-year-picker">
                    <button aria-label="Année précédente" onClick={() => setYear(value => Math.max(2020, value - 1))}>‹</button>
                    <strong>{year}{season === "winter" ? "–" + (year + 1) : ""}</strong>
                    <button aria-label="Année suivante" disabled={year >= new Date().getFullYear() + 1} onClick={() => setYear(value => Math.min(new Date().getFullYear() + 1, value + 1))}>›</button>
                </div>
            </div>
            {error && <div className="season-message error">{error}<button onClick={() => void loadSeason()}>Réessayer</button></div>}
            <section className="season-overview-grid">
                <article className="season-stat-card season-personal-card">
                    <div className="season-card-top"><span>TA SAISON</span><span className="season-rank-icon">✦</span></div>
                    {loading ? <div className="season-skeleton" /> : <>
                        <div className="season-rank-name" style={{ color: currentRank.color }}>{me?.division || "Frozen"}</div>
                        <div className="season-xp-number">{(me?.xp || 0).toLocaleString("fr-FR")} <small>XP saisonniers</small></div>
                        <div className="season-progress-track"><span style={{ width: progress + "%", background: currentRank.color }} /></div>
                        <div className="season-progress-label">{nextRank ? (Math.max(0, nextRank.min - (me?.xp || 0)).toLocaleString("fr-FR") + " XP avant " + nextRank.name) : "Rang ultime atteint"}</div>
                    </>}
                </article>
                <article className="season-stat-card"><div className="season-card-top"><span>TON CLASSEMENT</span><span>↗</span></div>{loading ? <div className="season-skeleton" /> : <><div className="season-stat-number">{me ? "#" + me.rank : "—"}</div><div className="season-stat-caption">{me ? "parmi les participants visibles" : "Pas encore classé"}</div></>}</article>
                <article className="season-stat-card"><div className="season-card-top"><span>JOURS ACTIFS</span><span>◷</span></div>{loading ? <div className="season-skeleton" /> : <><div className="season-stat-number">{me?.activeDays || 0}</div><div className="season-stat-caption">jours avec au moins une action</div></>}</article>
            </section>
            <section className="season-ranks-section">
                <div className="season-section-heading"><div><span className="season-section-kicker">PROGRESSION</span><h2>Les rangs de la saison</h2></div><span className="season-section-note">XP gagnés pendant la saison</span></div>
                <div className="season-ranks-grid">{RANKS.map(rank => <div key={rank.name} className={"season-rank-chip " + (currentRank.name === rank.name ? "current" : "")}><span className="season-rank-glyph" style={{ color: rank.color }}>{rank.name === "Eternal" ? "✧" : rank.name === "Aurora" ? "✦" : "◇"}</span><strong>{rank.name}</strong><small>{rank.min.toLocaleString("fr-FR")}+ XP</small></div>)}</div>
            </section>
            <section className="season-leaderboard-section">
                <div className="season-section-heading"><div><span className="season-section-kicker">COMMUNAUTÉ</span><h2>Classement {season === "winter" ? "hivernal" : "estival"}</h2><p>Les scores combinent tâches terminées, sessions Flow et habitudes réussies pendant cette saison.</p></div><span className="season-participant-count">{data?.leaderboard.length || 0} participants</span></div>
                <div className="season-leaderboard">
                    <div className="season-leaderboard-head"><span>Rang</span><span>Participant</span><span>Jours actifs</span><span>XP</span></div>
                    {loading ? <div className="season-empty">Chargement du classement…</div> : data?.leaderboard.length ? data.leaderboard.map(entry => <div key={entry.userId} className={"season-leaderboard-row " + (entry.isMe ? "is-me" : "")}>
                        <span className={"season-position pos-" + entry.rank}>{entry.rank <= 3 ? ["♛", "Ⅱ", "Ⅲ"][entry.rank - 1] : "#" + entry.rank}</span>
                        <div className="season-member">{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : <span className="season-avatar-fallback">{entry.username.slice(0, 1).toUpperCase()}</span>}<span><strong>{entry.username}{entry.isMe ? " · Toi" : ""}</strong><small>{entry.division}</small></span></div>
                        <span className="season-active-days">{entry.activeDays} j</span><strong className="season-member-xp">{entry.xp.toLocaleString("fr-FR")} XP</strong>
                    </div>) : <div className="season-empty">Pas encore de score pour cette saison. Termine une tâche ou une habitude pour lancer ton Arc.</div>}
                </div>
                <p className="season-footnote">Le rang final dépend des XP saisonniers. Les XP généraux de Grindly ne sont pas modifiés.</p>
            </section>
        </main>
    </div>
}
