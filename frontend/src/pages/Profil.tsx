import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/profil.css"
import { getProfil, updateProfil } from "../services/taskService"

export default function Profil() {

    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)
    const [stats, setStats] = useState({ tasksCompleted: 0, themesCreated: 0, communityPosts: 0 })

    useEffect(() => {
        getProfil()
            .then(data => {
                setUsername(data.username ?? "")
                setBio(data.bio ?? "")
                setEmail(data.email)
                setStats(data.stats)
                setLoading(false)
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

            </main>

        </div>
    )
}