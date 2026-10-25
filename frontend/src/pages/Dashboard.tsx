import "../assets/css/dashboard.css"
import { useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import { useDashboard } from "../services/Dashboard"

type TaskFilter = "all" | "pending" | "done"

export function Dashboard() {
    const {
        dark,
        tasks,
        themes,
        dailyState,
        notifications,
        newTask,
        setNewTask,
        priority,
        setPriority,
        themeIds,
        toggleThemeSelection,
        frequency,
        setFrequency,
        deadline,
        setDeadline,
        note,
        setNote,
        completionTarget,
        setCompletionTarget,
        themeName,
        setThemeName,
        themeEmoji,
        setThemeEmoji,
        themeColor,
        setThemeColor,
        showTaskForm,
        showThemeForm,
        handleToggleTaskForm,
        handleToggleThemeForm,
        handleCreateTask,
        handleCreateTheme,
        handleDeleteTheme,
        toggleDone,
        archiveTask,
        permanentlyDeleteTask,
        navigate,
    } = useDashboard()

    const [filter, setFilter] = useState<TaskFilter>("all")
    const [search, setSearch] = useState("")
    const [showThemes, setShowThemes] = useState(false)

    const visibleTasks = useMemo(() => {
        const query = search.trim().toLocaleLowerCase("fr-FR")

        return tasks.filter(task => {
            const matchesSearch = !query || task.title.toLocaleLowerCase("fr-FR").includes(query)
            const isDone = dailyState.get(task.id)?.done_today ?? false
            const matchesFilter =
                filter === "all" ||
                (filter === "done" && isDone) ||
                (filter === "pending" && !isDone)

            return matchesSearch && matchesFilter
        })
    }, [tasks, dailyState, filter, search])

    const doneCount = tasks.filter(task => dailyState.get(task.id)?.done_today).length
    const pendingCount = Math.max(0, tasks.length - doneCount)
    const highPriorityCount = tasks.filter(
        task => task.priority?.toLowerCase() === "high" && !(dailyState.get(task.id)?.done_today ?? false)
    ).length
    const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(new Date())

    return (
        <div className={dark ? "dashboard dark" : "dashboard light"}>
            <Navbar notifCount={notifications.length} />

            <main className="main dashboard-main" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 64px" }}>
                <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
                    <div>
                        <p style={{ margin: "0 0 8px", opacity: 0.65, fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5 }}>
                            {dateLabel.charAt(0).toLocaleUpperCase("fr-FR") + dateLabel.slice(1)}
                        </p>
                        <h1 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 40px)" }}>Mon espace Grindly</h1>
                        <p style={{ margin: "10px 0 0", opacity: 0.75 }}>Une liste claire, une étape à la fois.</p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        <button type="button" className="main-button" onClick={handleToggleTaskForm}>
                            {showTaskForm ? "Fermer le formulaire" : "+ Nouvelle tâche"}
                        </button>
                        <button type="button" className="main-button secondary" onClick={() => navigate("/flow")}>
                            Lancer une session Flow
                        </button>
                    </div>
                </header>

                <section aria-label="Résumé de la journée" style={{ border: "1px solid var(--border-color, rgba(128,128,128,.25))", borderRadius: 16, padding: 20, marginBottom: 24 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                            <h2 style={{ margin: "0 0 5px", fontSize: 20 }}>Aujourd’hui</h2>
                            <p style={{ margin: 0, opacity: 0.7 }}>{doneCount} terminée(s) sur {tasks.length}</p>
                        </div>
                        <strong>{progress}%</strong>
                    </div>
                    <div role="progressbar" aria-label="Progression quotidienne" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} style={{ height: 8, background: "rgba(128,128,128,.2)", borderRadius: 99, overflow: "hidden", margin: "16px 0 20px" }}>
                        <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent-color, #7c6ee6)", transition: "width .2s ease" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                        <Stat label="Tâches" value={tasks.length} />
                        <Stat label="À faire" value={pendingCount} />
                        <Stat label="Terminées aujourd’hui" value={doneCount} />
                        <Stat label="Priorité haute" value={highPriorityCount} />
                    </div>
                </section>

                {showTaskForm && (
                    <section className="theme-create-wrapper" aria-label="Créer une tâche" style={{ marginBottom: 24 }}>
                        <div className="theme-create" style={{ display: "grid", gap: 14 }}>
                            <h2 style={{ margin: 0 }}>Nouvelle tâche</h2>
                            <label className="theme-field">
                                <span className="theme-label">Nom de la tâche *</span>
                                <input className="theme-input" value={newTask} onChange={event => setNewTask(event.target.value)} placeholder="Ex. Réviser 20 minutes" maxLength={200} />
                            </label>

                            <label className="theme-field">
                                <span className="theme-label">Priorité</span>
                                <select className="theme-select" value={priority} onChange={event => setPriority(event.target.value)}>
                                    <option value="Low">Basse</option>
                                    <option value="Medium">Moyenne</option>
                                    <option value="High">Haute</option>
                                </select>
                            </label>

                            <label className="theme-field">
                                <span className="theme-label">Fréquence</span>
                                <select className="theme-select" value={frequency} onChange={event => setFrequency(event.target.value)}>
                                    <option value="daily">Chaque jour</option>
                                    <option value="weekly">Chaque semaine</option>
                                    <option value="monthly">Chaque mois</option>
                                    <option value="once">Une seule fois</option>
                                </select>
                            </label>

                            {frequency !== "once" && (
                                <label className="theme-field">
                                    <span className="theme-label">Répétitions nécessaires par jour</span>
                                    <input className="theme-input" type="number" min={1} max={30} value={completionTarget} onChange={event => setCompletionTarget(Math.min(30, Math.max(1, Number(event.target.value) || 1)))} />
                                </label>
                            )}

                            <label className="theme-field">
                                <span className="theme-label">Date limite (facultative)</span>
                                <input className="theme-input" type="date" value={deadline} onChange={event => setDeadline(event.target.value)} />
                            </label>

                            <label className="theme-field">
                                <span className="theme-label">Note (facultative)</span>
                                <input className="theme-input" value={note} onChange={event => setNote(event.target.value)} placeholder="Ajouter un détail" maxLength={1000} />
                            </label>

                            {themes.length > 0 && (
                                <fieldset style={{ border: "1px solid rgba(128,128,128,.3)", borderRadius: 12, padding: 12 }}>
                                    <legend className="theme-label">Thèmes (3 maximum)</legend>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {themes.map(theme => {
                                            const selected = themeIds.includes(theme.id)
                                            return (
                                                <button
                                                    key={theme.id}
                                                    type="button"
                                                    onClick={() => toggleThemeSelection(theme.id)}
                                                    disabled={!selected && themeIds.length >= 3}
                                                    aria-pressed={selected}
                                                    style={{
                                                        border: `1px solid ${theme.color || "#888"}`,
                                                        borderRadius: 999,
                                                        padding: "7px 12px",
                                                        background: selected ? `${theme.color || "#888"}22` : "transparent",
                                                        color: "inherit",
                                                        opacity: !selected && themeIds.length >= 3 ? 0.45 : 1,
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {theme.emoji || "•"} {theme.name}{selected ? " ✓" : ""}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </fieldset>
                            )}

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button type="button" className="main-button" onClick={() => void handleCreateTask()} disabled={!newTask.trim()}>
                                    Créer la tâche
                                </button>
                                <button type="button" className="main-button secondary" onClick={handleToggleTaskForm}>Annuler</button>
                            </div>
                        </div>
                    </section>
                )}

                <section aria-label="Liste des tâches">
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 22 }}>Mes tâches <span style={{ opacity: 0.6, fontSize: 15 }}>({visibleTasks.length})</span></h2>
                        <button type="button" className="main-button secondary" onClick={handleToggleThemeForm}>
                            {showThemeForm ? "Fermer les thèmes" : "+ Nouveau thème"}
                        </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) auto", gap: 10, marginBottom: 16 }}>
                        <input className="theme-input" aria-label="Rechercher une tâche" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une tâche…" />
                        <select className="theme-select" aria-label="Filtrer les tâches" value={filter} onChange={event => setFilter(event.target.value as TaskFilter)}>
                            <option value="all">Toutes</option>
                            <option value="pending">À faire</option>
                            <option value="done">Terminées aujourd’hui</option>
                        </select>
                    </div>

                    {tasks.length === 0 ? (
                        <div style={{ padding: 28, textAlign: "center", border: "1px dashed rgba(128,128,128,.4)", borderRadius: 16 }}>
                            <h3 style={{ marginTop: 0 }}>Aucune tâche reçue par l’application</h3>
                            <p style={{ opacity: 0.75, marginBottom: 16 }}>Si tu as déjà des tâches dans MySQL, le problème vient probablement de la réponse de l’API ou du compte utilisé, pas de l’affichage.</p>
                            <button type="button" className="main-button" onClick={handleToggleTaskForm}>Créer une tâche test</button>
                        </div>
                    ) : visibleTasks.length === 0 ? (
                        <p style={{ padding: 24, textAlign: "center", opacity: 0.7 }}>Aucune tâche ne correspond à cette recherche ou à ce filtre.</p>
                    ) : (
                        <div style={{ display: "grid", gap: 10 }}>
                            {visibleTasks.map(task => {
                                const isDone = dailyState.get(task.id)?.done_today ?? task.done_today ?? false
                                const taskThemes = task.themes?.length
                                    ? task.themes
                                    : task.theme_name
                                        ? [{ id: task.theme_id ?? 0, name: task.theme_name, emoji: task.theme_emoji, color: task.theme_color || "#888" }]
                                        : []

                                return (
                                    <article key={task.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14, padding: 16, border: "1px solid rgba(128,128,128,.25)", borderRadius: 14 }}>
                                        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                                            <h3 style={{ margin: "0 0 6px", fontSize: 16, textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.65 : 1, overflowWrap: "anywhere" }}>{task.title}</h3>
                                            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12, opacity: 0.75 }}>
                                                <span>{task.priority === "High" ? "Priorité haute" : task.priority === "Low" ? "Priorité basse" : "Priorité moyenne"}</span>
                                                <span>·</span>
                                                <span>{task.frequency === "once" ? "Une seule fois" : task.frequency === "weekly" ? "Chaque semaine" : task.frequency === "monthly" ? "Chaque mois" : "Chaque jour"}</span>
                                                {taskThemes.map(theme => <span key={theme.id} style={{ borderRadius: 999, padding: "3px 8px", background: `${theme.color || "#888"}22`, color: "inherit" }}>{theme.emoji || "•"} {theme.name}</span>)}
                                                {task.deadline && <span>Échéance : {new Date(task.deadline).toLocaleDateString("fr-FR")}</span>}
                                            </div>
                                            {task.note && <p style={{ margin: "8px 0 0", opacity: 0.7, fontSize: 13 }}>{task.note}</p>}
                                        </div>
                                        <div className="dashboard-task-actions">
                                            <button
                                                type="button"
                                                className={isDone ? "dashboard-task-action is-complete" : "dashboard-task-action is-primary"}
                                                onClick={() => void toggleDone(task.id)}
                                                aria-label={isDone ? `Annuler la validation de ${task.title}` : `Valider ${task.title} comme effectuée`}
                                                title={isDone ? "Annuler la validation du jour" : "Valider la tâche effectuée"}
                                            >
                                                <span aria-hidden="true">{isDone ? "✓" : "○"}</span>
                                                {isDone ? "Terminée aujourd’hui" : "Valider"}
                                            </button>
                                            <button
                                                type="button"
                                                className="dashboard-task-action is-archive"
                                                onClick={() => void archiveTask(task.id)}
                                                aria-label={`Archiver ${task.title}`}
                                                title="Archiver la tâche"
                                            >
                                                Archiver
                                            </button>
                                            <button
                                                type="button"
                                                className="dashboard-task-action is-delete"
                                                onClick={() => {
                                                    if (window.confirm(`Supprimer définitivement « ${task.title} » ? Cette action est irréversible.`)) {
                                                        void permanentlyDeleteTask(task.id)
                                                    }
                                                }}
                                                aria-label={`Supprimer définitivement ${task.title}`}
                                                title="Suppression définitive"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </section>

                {showThemeForm && (
                    <section className="theme-create-wrapper" aria-label="Créer un thème" style={{ marginTop: 24 }}>
                        <div className="theme-create" style={{ display: "grid", gap: 12 }}>
                            <h2 style={{ margin: 0 }}>Nouveau thème</h2>
                            <label className="theme-field">
                                <span className="theme-label">Nom du thème *</span>
                                <input className="theme-input" value={themeName} onChange={event => setThemeName(event.target.value)} placeholder="Ex. Études" maxLength={80} />
                            </label>
                            <label className="theme-field">
                                <span className="theme-label">Emoji (facultatif)</span>
                                <input className="theme-input" value={themeEmoji} onChange={event => setThemeEmoji(event.target.value)} placeholder="📚" maxLength={12} />
                            </label>
                            <label className="theme-field">
                                <span className="theme-label">Couleur</span>
                                <input className="theme-input" type="color" value={themeColor} onChange={event => setThemeColor(event.target.value)} />
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                <button type="button" className="main-button" onClick={() => void handleCreateTheme()} disabled={!themeName.trim()}>Créer le thème</button>
                                <button type="button" className="main-button secondary" onClick={handleToggleThemeForm}>Annuler</button>
                            </div>
                        </div>
                    </section>
                )}

                <section aria-label="Mes thèmes" style={{ marginTop: 28 }}>
                    <button type="button" className="main-button secondary" onClick={() => setShowThemes(value => !value)}>
                        {showThemes ? "Masquer les thèmes" : `Afficher les thèmes (${themes.length})`}
                    </button>
                    {showThemes && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
                            {themes.length === 0 ? <p>Aucun thème créé pour le moment.</p> : themes.map(theme => (
                                <article key={theme.id} style={{ border: `1px solid ${theme.color || "#888"}66`, borderRadius: 14, padding: 16 }}>
                                    <div style={{ fontSize: 24 }}>{theme.emoji || "•"}</div>
                                    <h3 style={{ margin: "8px 0" }}>{theme.name}</h3>
                                    <p style={{ margin: "0 0 12px", opacity: 0.7, fontSize: 13 }}>{tasks.filter(task => task.theme_id === theme.id || task.themes?.some(item => item.id === theme.id)).length} tâche(s)</p>
                                    <button type="button" className="main-button secondary" onClick={() => void handleDeleteTheme(theme.id)}>Supprimer</button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <article style={{ borderRadius: 12, padding: 14, background: "rgba(128,128,128,.08)" }}>
            <p style={{ margin: "0 0 8px", opacity: 0.7, fontSize: 13 }}>{label}</p>
            <strong style={{ fontSize: 26 }}>{value}</strong>
        </article>
    )
}
