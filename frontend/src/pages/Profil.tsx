import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/profil.css"
import { getProfil, updateProfil } from "../services/taskService"
import type { Achievement } from "../services/taskService"

export default function Profil() {

    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(true)
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [saved, setSaved] = useState(false)
    const [stats, setStats] = useState({
        tasksCompleted: 0,
        themesCreated: 0,
        communityPosts: 0,
        activityDays: 0,
        xp: 0,
        division: "Fer III",
        top3Count: 0,
        streak: 0
    })

    useEffect(() => {
        getProfil()
            .then(data => {
                setUsername(data.username ?? "")
                setBio(data.bio ?? "")
                setEmail(data.email)
                setStats(data.stats)
                setLoading(false)
                setAchievements(data.achievements ?? [])
            })
            .catch(err => console.error(err))
    }, [])

    async function handleSave() {
        try {
            await updateProfil({ username, bio })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err)
            alert("Failed to save profile")
        }
    }


    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    if (loading) return <div className="profil-page">Loading...</div>
    function getDivisionColor(division: string) {
        if (division.includes("Fer")) return "#9ca3af"
        if (division.includes("Bronze")) return "#cd7f32"
        if (division.includes("Argent")) return "#94a3b8"
        if (division.includes("Or")) return "#f59e0b"
        if (division.includes("Platine")) return "#22d3ee"
        if (division.includes("Émeraude")) return "#22c55e"
        if (division.includes("Diamant")) return "#818cf8"
        if (division.includes("Maître")) return "#a855f7"
        if (division.includes("Grand Maître")) return "#ef4444"
        if (division.includes("Challenger")) return "#f97316"
        return "#6366f1"
    }
    return (
        <div className="profil-page">

            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    <div className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</div>
                    <div className="nav-item" onClick={() => navigate("/objectifs")}>Objectifs</div>
                    <div className="nav-item" onClick={() => navigate("/flow")}>Flow</div>
                    <div className="nav-item" onClick={() => navigate("/profil")}>Profil</div>
                    <div className="nav-item" onClick={() => navigate("/communaute")}>Communauté</div>
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                        <div className="nav-avatar">
                            <img src="https://i.pravatar.cc/40" alt="avatar" />
                        </div>
                    </div>
                </nav>
            </header>

            <main className="profil-main">

                <h1 className="profil-title">Profile</h1>

                <section className="profil-card">
                    <div className="profil-avatar">
                        <img src="https://i.pravatar.cc/120" alt="avatar" />
                    </div>
                    <div className="profil-form">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                        />
                        <label>Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                        <button className="profil-save" onClick={handleSave}>
                            {saved ? "✓ Saved!" : "Save profile"}
                        </button>
                        <button className="profil-logout" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </section>

                <section className="profil-stats">
                    <div className="stat-card">
                        <h3>Tasks completed</h3>
                        <p>{stats.tasksCompleted}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Themes created</h3>
                        <p>{stats.themesCreated}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Community posts</h3>
                        <p>{stats.communityPosts}</p>
                    </div>
                </section>

                <section className="profil-xp">
                    <h2 className="profil-section-title">Statistiques</h2>
                    <div className="profil-stats">
                        <div className="stat-card">
                            <h3>Jours d'activité</h3>
                            <p>{stats.activityDays}</p>
                        </div>
                        <div className="stat-card xp-card">
                            <h3>XP gagnés</h3>
                            <p>{stats.xp.toLocaleString()}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Streak actuel</h3>
                            <p>{stats.streak} 🔥</p>
                        </div>
                        <div className="stat-card">
                            <h3>Division actuelle</h3>
                            <p className="division-badge" style={{ color: getDivisionColor(stats.division) }}>
                                {stats.division}
                            </p>
                        </div>
                        <div className="stat-card">
                            <h3>Fois dans le top 3</h3>
                            <p>{stats.top3Count}</p>
                        </div>
                    </div>
                </section>

                <section className="profil-achievements">
                    <h2 className="profil-section-title">Succès</h2>
                    {achievements.map(a => (
                        <div key={a.id} className={`achievement-card ${a.completed ? "completed" : ""}`}>
                            <div className="achievement-top">
                                <span className="achievement-level">★ NIVEAU {a.level}</span>
                                <span className="achievement-name">{a.name}</span>
                            </div>
                            <div className="achievement-progress-bar">
                                <div
                                    className="achievement-progress-fill"
                                    style={{ width: `${Math.min((a.progress / a.goal) * 100, 100)}%` }}
                                />
                            </div>
                            <div className="achievement-bottom">
                                <span className="achievement-desc">{a.description}</span>
                                <span className="achievement-count">{a.progress}/{a.goal}</span>
                            </div>
                        </div>
                    ))}
                </section>
            </main>

        </div>
    )
}