import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getTaskHistory } from "../services/taskService"
import type { TaskHistory } from "../services/taskService"
import "../assets/css/dashboard.css"
import "../assets/css/historique.css"

export default function Historique() {
    const navigate = useNavigate()
    const [tasks, setTasks] = useState<TaskHistory[]>([])
    const [filter, setFilter] = useState<"all" | "done" | "archived">("all")
    const [dark] = useState(true)

    useEffect(() => {
        getTaskHistory().then(setTasks).catch(console.error)
    }, [])

    const filtered = tasks.filter(t => filter === "all" ? true : t.status === filter)

    function formatDate(d: string | null) {
        if (!d) return "—"
        return new Date(d).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", year: "numeric"
        })
    }

    return (
        <div className={dark ? "dashboard dark" : "dashboard light"}>
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

                    <div className="nav-item nav-focus">⚡ Focus</div>
                </nav>
            </header>

            <main className="main">
                <h1 className="title">Historique</h1>

                {/* FILTRES */}
                <div className="histo-filters">
                    {(["all", "done", "archived"] as const).map(f => (
                        <button
                            key={f}
                            className={`histo-filter-btn ${filter === f ? "active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === "all" ? "Toutes" : f === "done" ? "✅ Terminées" : "🗃 Archivées"}
                        </button>
                    ))}
                    <span className="histo-count">{filtered.length} tâche{filtered.length > 1 ? "s" : ""}</span>
                </div>

                {/* LISTE */}
                {filtered.length === 0 ? (
                    <div className="histo-empty">
                        Aucune tâche ici pour l'instant.
                    </div>
                ) : (
                    <div className="histo-list">
                        {filtered.map(task => (
                            <div key={task.id} className={`histo-card ${task.status}`}>

                                <div className="histo-card-left">
                                    <div className="histo-card-top">
                                        <span className="histo-title">{task.title}</span>
                                        <span className={`badge priority-${task.priority?.toLowerCase()}`}>
                                            {task.priority}
                                        </span>
                                        <span className={`badge type-${task.frequency}`}>
                                            {task.frequency}
                                        </span>
                                        {task.theme_name && (
                                            <span
                                                className="badge"
                                                style={{ color: task.theme_color ?? undefined }}
                                            >
                                                {task.theme_emoji} {task.theme_name}
                                            </span>
                                        )}
                                    </div>

                                    <div className="histo-meta">
                                        <span>📅 Créée le {formatDate(task.created_at)}</span>
                                        {task.status === "done" && (
                                            <span>✅ Terminée le {formatDate(task.completed_at)}</span>
                                        )}
                                        {task.status === "archived" && (
                                            <span>🗃 Archivée le {formatDate(task.archived_at)}</span>
                                        )}
                                        <span>⏱ {task.lifespan_days} jour{task.lifespan_days > 1 ? "s" : ""} de vie</span>
                                        <span>🔁 {task.total_completions} complétion{task.total_completions > 1 ? "s" : ""}</span>
                                    </div>
                                </div>

                                <div className="histo-status">
                                    {task.status === "done" ? "✅" : "🗃"}
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}