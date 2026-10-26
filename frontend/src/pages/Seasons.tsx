import { useCallback, useEffect, useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import { API_ROOT } from "../services/api"
import "../assets/css/seasons.css"

type SeasonKey = "winter" | "summer"
type SeasonGoal = { id: number; title: string; position: number; completedToday: boolean }
type SeasonEntry = { rank: number; userId: number; username: string; avatarUrl: string | null; xp: number; actions: number; activeDays: number; division: string; isMe: boolean }
type SeasonResponse = {
    season: string; seasonKey: SeasonKey; year: number; startsAt: string; endsAt: string
    opensAt: string; closesAt: string; isOpen: boolean; isFuture: boolean; isPast: boolean
    joined: boolean; badgeUnlocked: boolean; entryXp: number; leaderboard: SeasonEntry[]
    me: SeasonEntry | null; goals: SeasonGoal[]; presets: string[]; today: string
}
const RANKS = [
    { name: "Frozen", min: 0, color: "#9aa6b2" },
    { name: "Frost", min: 500, color: "#9ed9f3" },
    { name: "Blizzard", min: 1500, color: "#7bbce9" },
    { name: "Glacier", min: 3000, color: "#829cf2" },
    { name: "Aurora", min: 5000, color: "#c2a2f5" },
    { name: "Eternal", min: 7500, color: "#f2f5ff" },
]
function getRank(xp: number) { return [...RANKS].reverse().find(rank => xp >= rank.min) || RANKS[0] }
function formatDate(value: string) {
    const date = new Date(value.replace(" ", "T").replace(/Z$/, ""))
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}
function getSeasonDates(season: SeasonKey, year: number) {
    return season === "winter"
        ? { start: `${year}-11-01T00:00:00`, end: `${year + 1}-02-01T00:00:00` }
        : { start: `${year}-06-01T00:00:00`, end: `${year}-09-01T00:00:00` }
}
function getCountdown(dateValue: string) {
    const distance = new Date(dateValue).getTime() - Date.now()
    if (distance <= 0) return "Ouverture imminente"
    const days = Math.ceil(distance / 86400000)
    if (days > 1) return `Ouverture dans ${days} jours`
    const hours = Math.ceil(distance / 3600000)
    return hours > 1 ? `Ouverture dans ${hours} heures` : "Ouverture dans moins d’une heure"
}
export default function Seasons() {
    const [season, setSeason] = useState<SeasonKey>("winter")
    const [year, setYear] = useState(new Date().getFullYear())
    const [data, setData] = useState<SeasonResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState("")
    const [goalDrafts, setGoalDrafts] = useState<string[]>([])
    const [savingGoals, setSavingGoals] = useState(false)
    const [editingGoals, setEditingGoals] = useState(false)
    const token = () => localStorage.getItem("token") || ""
    async function readApiResponse(response: Response) {
        const contentType = response.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
            const body = await response.text()
            if (body.trimStart().startsWith("<!DOCTYPE") || body.trimStart().startsWith("<html")) {
                throw new Error("L’API des saisons a renvoyé une page HTML au lieu du JSON. Vérifie le déploiement du backend et l’URL VITE_API_URL.")
            }
            throw new Error("Réponse inattendue du serveur des saisons.")
        }
        return response.json()
    }
    const endpoint = `${API_ROOT}/seasons/${season}/${year}`

    const loadSeason = useCallback(async () => {
        setLoading(true); setError(""); setNotice("")
        try {
            const response = await fetch(endpoint, { headers: { Authorization: "Bearer " + token() } })
            const result = await readApiResponse(response)
            if (!response.ok) throw new Error(result.message || "Impossible de charger cette saison.")
            const seasonData = result as SeasonResponse
            setData(seasonData)
            setGoalDrafts(Array.from({ length: 10 }, (_, index) => seasonData.goals[index]?.title || seasonData.presets?.[index] || ""))
            setEditingGoals(seasonData.joined && seasonData.goals.length !== 10)
        } catch (err) { setData(null); setError(err instanceof Error ? err.message : "Une erreur est survenue.") }
        finally { setLoading(false) }
    }, [endpoint])
    useEffect(() => { void loadSeason() }, [loadSeason])

    const currentXp = data?.me?.xp || 0
    const currentRank = getRank(currentXp)
    const nextRank = RANKS.find(rank => rank.min > currentXp)
    const progress = nextRank ? Math.min(100, Math.round((currentXp - currentRank.min) / (nextRank.min - currentRank.min) * 100)) : 100
    const dateRange = useMemo(() => getSeasonDates(season, year), [season, year])
    const goalDoneCount = data?.goals.filter(goal => goal.completedToday).length || 0

    async function joinSeason() {
        setBusy(true); setError(""); setNotice("")
        try {
            const response = await fetch(endpoint + "/join", { method: "POST", headers: { Authorization: "Bearer " + token() } })
            const result = await readApiResponse(response)
            if (!response.ok) throw new Error(result.message || "Impossible de rejoindre cet Arc.")
            setNotice(result.message || "Arc débloqué.")
            await loadSeason()
        } catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue.") }
        finally { setBusy(false) }
    }
    async function saveGoals() {
        setSavingGoals(true); setError(""); setNotice("")
        try {
            const response = await fetch(endpoint + "/goals", {
                method: "PUT",
                headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
                body: JSON.stringify({ goals: goalDrafts }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || "Impossible d’enregistrer les objectifs.")
            setData(previous => previous ? { ...previous, goals: result.goals } : previous)
            setEditingGoals(false); setNotice("Tes 10 objectifs sont enregistrés. Tu peux les cocher chaque jour.")
        } catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue.") }
        finally { setSavingGoals(false) }
    }
    async function toggleGoal(goalId: number) {
        setError("")
        try {
            const response = await fetch(endpoint + `/goals/${goalId}/toggle`, { method: "POST", headers: { Authorization: "Bearer " + token() } })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || "Impossible de mettre à jour l’objectif.")
            setData(previous => previous ? { ...previous, goals: result.goals } : previous)
        } catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue.") }
    }

    const seasonName = season === "winter" ? "Winter Arc" : "Summer Arc"
    const seasonClass = season
    const startLabel = data?.startsAt || dateRange.start
    const endLabel = data?.endsAt || dateRange.end

    return <div className={"seasons-page season-theme-" + seasonClass}>
        <Navbar />
        <main className="seasons-main">
            <header className={"season-hero " + season}>
                <div className="season-hero-noise" />
                <div className="season-hero-content">
                    <span className="season-eyebrow">GRINDLY · SEASONAL CHALLENGES</span>
                    <h1>{seasonName}</h1>
                    <p>{season === "winter" ? "Construis une discipline solide, dans le calme, le froid et la constance." : "Passe à l’action, crée ton élan et récolte les résultats de tes efforts."}</p>
                    <div className="season-dates">{season === "winter" ? "❄" : "☀"} {formatDate(startLabel)} — {formatDate(endLabel)}</div>
                </div>
                <div className="season-hero-mark" aria-hidden="true">{season === "winter" ? "❄" : "☀"}</div>
                <div className="season-hero-orbit" aria-hidden="true" />
            </header>

            <div className="season-switch-row">
                <div className="season-switch" role="tablist" aria-label="Choisir un Arc">
                    <button className={season === "winter" ? "active winter" : ""} onClick={() => setSeason("winter")}>❄ Winter Arc</button>
                    <button className={season === "summer" ? "active summer" : ""} onClick={() => setSeason("summer")}>☀ Summer Arc</button>
                </div>
                <div className="season-year-picker">
                    <button aria-label="Année précédente" onClick={() => setYear(value => Math.max(2020, value - 1))}>‹</button>
                    <strong>{year}{season === "winter" ? "–" + (year + 1) : ""}</strong>
                    <button aria-label="Année suivante" disabled={year >= new Date().getFullYear() + 1} onClick={() => setYear(value => Math.min(new Date().getFullYear() + 1, value + 1))}>›</button>
                </div>
            </div>

            {error && <div className="season-message error" role="alert">{error}<button onClick={() => void loadSeason()}>Réessayer</button></div>}
            {notice && <div className="season-message success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Fermer">×</button></div>}

            {loading ? <div className="season-lock-panel"><div className="season-skeleton" /><p>Préparation de ton Arc…</p></div> : !data?.isOpen ? (
                <section className={"season-lock-panel " + season}>
                    <div className="season-lock-icon">{data?.isPast ? "◷" : "🔒"}</div>
                    <span className="season-section-kicker">{data?.isPast ? "SAISON TERMINÉE" : "ARC VERROUILLÉ"}</span>
                    <h2>{data?.isPast ? "Le prochain Arc approche." : "Chaque saison a son moment."}</h2>
                    <p>{data?.isPast ? "Cette période est terminée. Garde ton élan et prépare le prochain cycle." : "Le tableau de bord, le badge et les objectifs seront accessibles à l’ouverture officielle. Pas de raccourci : on commence ensemble le premier jour."}</p>
                    {!data?.isPast && <div className="season-countdown">{getCountdown(data?.opensAt || dateRange.start)}</div>}
                    <div className="season-lock-meta">
                        <span>OUVERTURE <strong>{formatDate(data?.opensAt || dateRange.start)}</strong></span>
                        <span>FERMETURE <strong>{formatDate(data?.closesAt || dateRange.end)}</strong></span>
                    </div>
                    <div className="season-lock-rewards">
                        <span className="season-reward-medal">{season === "winter" ? "❄" : "☀"}</span>
                        <span><strong>Badge {season === "winter" ? "Frostbound" : "Sunforge"}</strong><small>Débloqué en rejoignant l’Arc pendant la saison</small></span>
                        <b>+50 XP</b>
                    </div>
                    <button className="season-locked-cta" disabled>🔒 Disponible à l’ouverture</button>
                </section>
            ) : !data.joined ? (
                <section className={"season-join-panel " + season}>
                    <div className="season-join-copy"><span className="season-section-kicker">LA SAISON EST OUVERTE</span><h2>Prêt·e à entrer dans ton {seasonName} ?</h2><p>Rejoins l’Arc pour débloquer ton badge permanent et recevoir tes premiers XP saisonniers.</p></div>
                    <div className="season-join-reward"><span>{season === "winter" ? "❄" : "☀"}</span><strong>{season === "winter" ? "Frostbound" : "Sunforge"}</strong><small>Badge de saison</small><b>+50 XP</b></div>
                    <button className="season-join-button" onClick={() => void joinSeason()} disabled={busy}>{busy ? "Déblocage…" : "Entrer dans l’Arc →"}</button>
                </section>
            ) : (
                <>
                    <section className={"season-unlocked-banner " + season}>
                        <div className="season-unlocked-badge">{season === "winter" ? "❄" : "☀"}</div>
                        <div><span className="season-section-kicker">ARC DÉBLOQUÉ · BADGE OBTENU</span><h2>{season === "winter" ? "Frostbound" : "Sunforge"}</h2><p>Tu as rejoint le {seasonName}. Le badge est acquis pour ton profil et tes objectifs sont prêts.</p></div>
                        <div className="season-earned-xp">+{data.entryXp} <small>XP obtenus</small></div>
                    </section>

                    <section className="season-goals-section">
                        <div className="season-section-heading"><div><span className="season-section-kicker">TON PLAN QUOTIDIEN</span><h2>10 objectifs. Un jour à la fois.</h2><p>Choisis tes 10 priorités pour cet Arc ou écris les tiennes. La liste se réinitialise chaque jour, pas tes objectifs.</p></div><span className="season-goal-progress-pill">{goalDoneCount}/10 aujourd’hui</span></div>
                        {(!data.goals.length || editingGoals) ? (
                            <div className="season-goal-editor">
                                <div className="season-goal-editor-head"><div><strong>Construis ta liste</strong><small>10 objectifs, personnalisables à tout moment.</small></div><button type="button" className="season-preset-button" onClick={() => setGoalDrafts(data.presets.slice(0, 10))}>Utiliser les suggestions</button></div>
                                <div className="season-goal-inputs">{goalDrafts.map((goal, index) => <label className="season-goal-input-row" key={index}><span>{String(index + 1).padStart(2, "0")}</span><input maxLength={120} value={goal} onChange={event => setGoalDrafts(previous => previous.map((value, i) => i === index ? event.target.value : value))} placeholder={`Ton objectif n°${index + 1}`} /></label>)}</div>
                                <div className="season-goal-editor-footer"><small>Exemples : lire, réviser, bouger, créer, prendre soin de soi…</small><button className="season-goal-save" disabled={savingGoals || goalDrafts.some(goal => !goal.trim())} onClick={() => void saveGoals()}>{savingGoals ? "Enregistrement…" : "Enregistrer mes 10 objectifs"}</button></div>
                            </div>
                        ) : (
                            <div className="season-goal-checklist">
                                <div className="season-goal-checklist-top"><span>{data.today ? new Date(data.today + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "Aujourd’hui"}</span><button onClick={() => { setGoalDrafts(data.goals.map(goal => goal.title)); setEditingGoals(true) }}>Modifier mes objectifs</button></div>
                                <div className="season-goal-progress-track"><span style={{ width: (goalDoneCount * 10) + "%" }} /></div>
                                {data.goals.map((goal, index) => <label key={goal.id} className={"season-goal-check-row " + (goal.completedToday ? "done" : "")}>
                                    <span className="season-goal-number">{String(index + 1).padStart(2, "0")}</span>
                                    <input type="checkbox" checked={goal.completedToday} onChange={() => void toggleGoal(goal.id)} />
                                    <span className="season-goal-check-title">{goal.title}</span>
                                    <span className="season-goal-check-state">{goal.completedToday ? "Fait" : "À faire"}</span>
                                </label>)}
                                <div className="season-goal-bottom-note">{goalDoneCount === 10 ? "Journée complétée. Ta constance construit l’Arc." : `Encore ${10 - goalDoneCount} objectif(s) pour compléter ta journée.`}<span>Nouvelle checklist chaque jour</span></div>
                            </div>
                        )}
                    </section>

                    <section className="season-overview-grid">
                        <article className="season-stat-card season-personal-card"><div className="season-card-top"><span>TA SAISON</span><span className="season-rank-icon">✦</span></div><div className="season-rank-name" style={{ color: currentRank.color }}>{data.me?.division || "Frozen"}</div><div className="season-xp-number">{currentXp.toLocaleString("fr-FR")} <small>XP saisonniers</small></div><div className="season-progress-track"><span style={{ width: progress + "%", background: currentRank.color }} /></div><div className="season-progress-label">{nextRank ? (Math.max(0, nextRank.min - currentXp).toLocaleString("fr-FR") + " XP avant " + nextRank.name) : "Rang ultime atteint"}</div></article>
                        <article className="season-stat-card"><div className="season-card-top"><span>TON CLASSEMENT</span><span>↗</span></div><div className="season-stat-number">{data.me ? "#" + data.me.rank : "—"}</div><div className="season-stat-caption">{data.me ? "parmi les participants visibles" : "Pas encore classé"}</div></article>
                        <article className="season-stat-card"><div className="season-card-top"><span>JOURS ACTIFS</span><span>◷</span></div><div className="season-stat-number">{data.me?.activeDays || 0}</div><div className="season-stat-caption">jours avec au moins une action</div></article>
                    </section>

                    <section className="season-ranks-section">
                        <div className="season-section-heading"><div><span className="season-section-kicker">PROGRESSION</span><h2>Les rangs de la saison</h2></div><span className="season-section-note">XP gagnés pendant la saison</span></div>
                        <div className="season-ranks-grid">{RANKS.map(rank => <div key={rank.name} className={"season-rank-chip " + (currentRank.name === rank.name ? "current" : "")}><span className="season-rank-glyph" style={{ color: rank.color }}>{rank.name === "Eternal" ? "✧" : rank.name === "Aurora" ? "✦" : "◇"}</span><strong>{rank.name}</strong><small>{rank.min.toLocaleString("fr-FR")}+ XP</small></div>)}</div>
                    </section>

                    <section className="season-leaderboard-section">
                        <div className="season-section-heading"><div><span className="season-section-kicker">COMMUNAUTÉ</span><h2>Classement {season === "winter" ? "hivernal" : "estival"}</h2><p>Les scores combinent tâches terminées, sessions Flow, habitudes réussies et bonus d’entrée.</p></div><span className="season-participant-count">{data.leaderboard.length} participants</span></div>
                        <div className="season-leaderboard"><div className="season-leaderboard-head"><span>Rang</span><span>Participant</span><span>Jours actifs</span><span>XP</span></div>
                            {data.leaderboard.length ? data.leaderboard.map(entry => <div key={entry.userId} className={"season-leaderboard-row " + (entry.isMe ? "is-me" : "")}><span className={"season-position pos-" + entry.rank}>{entry.rank <= 3 ? ["♛", "Ⅱ", "Ⅲ"][entry.rank - 1] : "#" + entry.rank}</span><div className="season-member">{entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : <span className="season-avatar-fallback">{entry.username.slice(0, 1).toUpperCase()}</span>}<span><strong>{entry.username}{entry.isMe ? " · Toi" : ""}</strong><small>{entry.division}</small></span></div><span className="season-active-days">{entry.activeDays} j</span><strong className="season-member-xp">{entry.xp.toLocaleString("fr-FR")} XP</strong></div>) : <div className="season-empty">Pas encore de score pour cette saison. Commence par ton premier objectif.</div>}
                        </div><p className="season-footnote">Le rang final dépend des XP saisonniers. Les XP généraux ne sont pas modifiés par les objectifs quotidiens.</p>
                    </section>
                </>
            )}
        </main>
    </div>
}
