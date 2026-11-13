import { useEffect, useState } from "react"
import { getTaskHistory, restoreTask, permanentlyDeleteTask } from "../services/taskService"
import type { TaskHistory } from "../services/taskService"
import "../assets/css/dashboard.css"
import "../assets/css/historique.css"
import Navbar from "../components/Navbar"

export default function Historique() {
    const [tasks, setTasks] = useState<TaskHistory[]>([])
        const [loadingId, setLoadingId] = useState<number | null>(null)
    const [error, setError] = useState("")

    async function loadHistory() {
        setError("")
        try {
            setTasks(await getTaskHistory())
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de charger l'historique.")
        }
    }

    useEffect(() => { void loadHistory() }, [])

    const filtered = tasks.filter(task => filter === "all" || task.status === filter)

    function formatDate(value: string | null) {
        if (!value) return "—"
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    }

    async function handleRestore(id: number) {
        setLoadingId(id)
        setError("")
        try {
            await restoreTask(id)
            setTasks(previous => previous.filter(task => task.id !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la restauration.")
        } finally {
            setLoadingId(null)
        }
    }

    async function handleDeletePermanently(id: number) {
        if (!window.confirm("Supprimer définitivement cette tâche ? Cette action est irréversible.")) return
        setLoadingId(id)
        setError("")
        try {
            await permanentlyDeleteTask(id)
            setTasks(previous => previous.filter(task => task.id !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la suppression.")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="dashboard dark">
            <Navbar />
            <main className="main">
                <div className="archive-page-heading">
                    <div>
                        <p className="archive-eyebrow">GRINDLY · MÉMOIRE</p>
                        <div className="archive-page-heading"><div><h1 className="title">Historique</h1><p className="archive-subtitle">Retrouve tes tâches terminées.</p></div><Link className="archive-link" to="/archives">Ouvrir les archives →</Link></div>
                        <p className="archive-subtitle">Retrouve les tâches terminées et les tâches mises de côté.</p>
                    </div>
                    <a className="archive-link" href="/archives">Ouvrir les archives →</a>
                </div>

                <div className="histo-filters">
                    {(["all", "done", "archived"] as const).map(value => (
                        <button key={value} className={`histo-filter-btn ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)}>
                            {value === "all" ? "Toutes" : value === "done" ? "Terminées" : "Archivées"}
                        </button>
                    ))}
                    <span className="histo-count">{filtered.length} tâche{filtered.length > 1 ? "s" : ""}</span>
                </div>

                {error && <p className="archive-error" role="alert">{error}</p>}
                {filtered.length === 0 ? (
                    <div className="histo-empty">Aucune tâche dans cet historique.</div>
                ) : (
                    <div className="histo-list">
                        {filtered.map(task => (
                            <article key={task.id} className={`histo-card ${task.status}`}>
                                <div className="histo-card-left">
                                    <div className="histo-card-top">
                                        <span className="histo-title">{task.title}</span>
                                        <span className={`badge priority-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                        <span className={`badge type-${task.frequency}`}>{task.frequency}</span>
                                        {task.theme_name && <span className="badge" style={{ color: task.theme_color ?? undefined }}>{task.theme_emoji} {task.theme_name}</span>}
                                    </div>
                                    <div className="histo-meta">
                                        <span>Créée le {formatDate(task.created_at)}</span>
                                        {task.status === "done" && <span>Terminée le {formatDate(task.completed_at)}</span>}
                                        {task.status === "archived" && <span>Archivée le {formatDate(task.archived_at)}</span>}
                                        <span>{task.lifespan_days} jour{task.lifespan_days > 1 ? "s" : ""} de vie</span>
                                        <span>{task.total_completions} complétion{task.total_completions > 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                                <div className="histo-actions">
                                    <button className="histo-restore-btn" onClick={() => void handleRestore(task.id)} disabled={loadingId === task.id}>
                                        {loadingId === task.id ? "..." : "Restaurer"}
                                    </button>
                                    <button className="histo-delete-btn" onClick={() => void handleDeletePermanently(task.id)} disabled={loadingId === task.id} title="Supprimer définitivement">
                                        Supprimer
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
