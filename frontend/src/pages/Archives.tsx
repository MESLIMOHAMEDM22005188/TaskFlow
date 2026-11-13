import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getArchivedTasks, restoreTask, permanentlyDeleteTask } from "../services/taskService"
import type { TaskHistory } from "../services/taskService"
import "../assets/css/dashboard.css"
import "../assets/css/historique.css"
import Navbar from "../components/Navbar"

export default function Archives() {
    const [tasks, setTasks] = useState<TaskHistory[]>([])
    const [loadingId, setLoadingId] = useState<number | null>(null)
    const [error, setError] = useState("")

    async function loadArchives() {
        setError("")
        try {
            setTasks(await getArchivedTasks())
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de charger les archives.")
        }
    }

    useEffect(() => { void loadArchives() }, [])

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
            setTasks(current => current.filter(task => task.id !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : "La restauration a échoué.")
        } finally {
            setLoadingId(null)
        }
    }

    async function handleDelete(id: number) {
        if (!window.confirm("Supprimer définitivement cette tâche ? Cette action est irréversible.")) return
        setLoadingId(id)
        setError("")
        try {
            await permanentlyDeleteTask(id)
            setTasks(current => current.filter(task => task.id !== id))
        } catch (err) {
            setError(err instanceof Error ? err.message : "La suppression a échoué.")
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
                        <p className="archive-eyebrow">GRINDLY · ESPACE DE STOCKAGE</p>
                        <h1 className="title">Archives</h1>
                        <p className="archive-subtitle">Tes tâches archivées sont conservées ici et restent disponibles après actualisation.</p>
                    </div>
                    <Link className="archive-link" to="/historique">Voir l’historique →</Link>
                </div>
                {error && <p className="archive-error" role="alert">{error}</p>}
                {tasks.length === 0 ? (
                    <div className="histo-empty">Aucune tâche archivée pour le moment.</div>
                ) : (
                    <div className="histo-list">
                        {tasks.map(task => (
                            <article key={task.id} className="histo-card archived">
                                <div className="histo-card-left">
                                    <div className="histo-card-top">
                                        <span className="histo-title">{task.title}</span>
                                        <span className={`badge priority-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                        <span className={`badge type-${task.frequency}`}>{task.frequency}</span>
                                        {task.theme_name && <span className="badge" style={{ color: task.theme_color ?? undefined }}>{task.theme_emoji} {task.theme_name}</span>}
                                    </div>
                                    <div className="histo-meta">
                                        <span>Créée le {formatDate(task.created_at)}</span>
                                        <span>Archivée le {formatDate(task.archived_at)}</span>
                                        <span>{task.lifespan_days} jour{task.lifespan_days > 1 ? "s" : ""} de vie</span>
                                        <span>{task.total_completions} complétion{task.total_completions > 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                                <div className="histo-actions">
                                    <button className="histo-restore-btn" onClick={() => void handleRestore(task.id)} disabled={loadingId === task.id}>
                                        {loadingId === task.id ? "..." : "Restaurer"}
                                    </button>
                                    <button className="histo-delete-btn" onClick={() => void handleDelete(task.id)} disabled={loadingId === task.id}>
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
