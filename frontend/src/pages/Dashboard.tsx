import "../assets/css/dashboard.css"
import { useState, useEffect, type CSSProperties } from "react"
import { useSearchParams } from "react-router-dom"
import { useDashboard } from "../services/Dashboard"

import Navbar from "../components/Navbar";

const normalizeThemeName = (value: string | null | undefined) =>
    (value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("fr-FR")

export function Dashboard() {
    const {
        navigate,
        dark, setDark,
        tasks,
        themes,
        dailyState,
        notifications,
        newTask, setNewTask,
        priority, setPriority,
        themeIds, toggleThemeSelection,
        frequency, setFrequency,
        deadline, setDeadline,
        note, setNote,
        completionTarget, setCompletionTarget,
        themeName, setThemeName,
        themeEmoji, setThemeEmoji,
        themeColor, setThemeColor,
        showTaskForm,
        showThemeForm,
        handleToggleTaskForm,
        handleToggleThemeForm,
        handleCreateTask,
        handleCreateTheme,
        handleDeleteTheme,
        toggleDone,
        deleteTask,
        archiveTask,
    } = useDashboard()

    const [showThemesList, setShowThemesList] = useState(false)
    const [deadlineMode, setDeadlineMode] = useState<"until_cancelled" | "date">("until_cancelled")
    const themeGroups: { theme: (typeof themes)[number]; ids: number[]; key: string }[] = []
    for (const theme of themes) {
        const key = normalizeThemeName(theme.name)
        const existing = themeGroups.find(group => group.key === key || group.ids.includes(theme.id))
        if (existing) {
            if (!existing.ids.includes(theme.id)) existing.ids.push(theme.id)
        } else {
            themeGroups.push({ theme, ids: [theme.id], key })
        }
    }
    const uniqueThemes = themeGroups.map(group => group.theme)
    const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "done">("all")
    const [searchParams, setSearchParams] = useSearchParams()
    const taskSearch = searchParams.get("search")?.trim() ?? ""
    const searchedTasks = taskSearch
        ? tasks.filter(task => task.title.toLocaleLowerCase("fr").includes(taskSearch.toLocaleLowerCase("fr")))
        : tasks
    const visibleTasks = searchedTasks.filter(task => {
        const isDone = dailyState.get(task.id)?.done_today ?? false
        if (taskFilter === "pending") return !isDone
        if (taskFilter === "done") return isDone
        return true
    })

    const doneTasks = tasks.filter(task => dailyState.get(task.id)?.done_today).length
    const pendingTasks = Math.max(0, tasks.length - doneTasks)
    const highPriorityTasks = tasks.filter(task => task.priority?.toLowerCase() === "high" && !dailyState.get(task.id)?.done_today).length
    const completionPercent = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0
    const todayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())

    return (
        <div className={dark ? "dashboard dark" : "dashboard light"}>
            <Navbar notifCount={notifications.length} />

            <main className="main dashboard-main">
                <section className="dashboard-hero">
                    <div className="dashboard-hero-copy">
                        <p className="dashboard-eyebrow">TON ESPACE PERSONNEL</p>
                        <h1 className="dashboard-heading">Fais de la place à <span>l’essentiel.</span></h1>
                        <p className="dashboard-subtitle">Une chose après l’autre. Chaque petite action compte.</p>
                        <p className="dashboard-date">{todayLabel.charAt(0).toLocaleUpperCase("fr-FR") + todayLabel.slice(1)}</p>
                    </div>
                    <div className="dashboard-hero-actions">
                        <button type="button" className="dashboard-primary-action" onClick={handleToggleTaskForm}>
                            <span aria-hidden="true">＋</span> Nouvelle tâche
                        </button>
                        <button type="button" className="dashboard-flow-action" onClick={() => navigate("/flow")}>
                            <span className="dashboard-flow-icon" aria-hidden="true">▶</span>
                            <span><strong>Lancer une session</strong><small>Passer en mode Flow</small></span>
                            <span aria-hidden="true">↗</span>
                        </button>
                    </div>
                    <div className="dashboard-hero-orb" aria-hidden="true"><span>✦</span></div>
                </section>
                {taskSearch && (
                    <div className="task-search-active">
                        <span>Résultats pour <strong>{taskSearch}</strong> · {visibleTasks.length} tâche(s)</span>
                        <button type="button" onClick={() => setSearchParams({})}>Effacer la recherche</button>
                    </div>
                )}

                <section className="dashboard-overview" aria-label="Résumé de la journée">
                    <div className="dashboard-overview-heading">
                        <div>
                            <p className="dashboard-eyebrow">EN UN COUP D’ŒIL</p>
                            <h2>Ta journée</h2>
                        </div>
                        <span className="dashboard-completion-pill">{completionPercent}% accompli</span>
                    </div>
                    <div className="dashboard-progress-track" role="progressbar" aria-label="Progression des tâches aujourd’hui" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}>
                        <span style={{ width: `${completionPercent}%` }} />
                    </div>
                    <div className="dashboard-stat-grid">
                        <article className="dashboard-stat-card stat-total"><span className="dashboard-stat-icon" aria-hidden="true">▤</span><span className="dashboard-stat-label">Tâches au total</span><strong>{tasks.length}</strong><small>Dans ton espace</small></article>
                        <article className="dashboard-stat-card stat-pending"><span className="dashboard-stat-icon" aria-hidden="true">◷</span><span className="dashboard-stat-label">À faire</span><strong>{pendingTasks}</strong><small>{pendingTasks === 1 ? "Tâche à terminer" : "Tâches à terminer"}</small></article>
                        <article className="dashboard-stat-card stat-done"><span className="dashboard-stat-icon" aria-hidden="true">✓</span><span className="dashboard-stat-label">Terminées aujourd’hui</span><strong>{doneTasks}</strong><small>{tasks.length ? `${completionPercent}% de ta liste` : "Commence avec une tâche"}</small></article>
                        <article className="dashboard-stat-card stat-priority"><span className="dashboard-stat-icon" aria-hidden="true">↗</span><span className="dashboard-stat-label">Priorité haute</span><strong>{highPriorityTasks}</strong><small>{highPriorityTasks ? "À traiter en premier" : "Rien d’urgent détecté"}</small></article>
                    </div>
                </section>

                <div className="action-center dashboard-actions">
                    <button type="button" className={`main-button ${showTaskForm ? "active" : ""}`} onClick={handleToggleTaskForm}>＋ Nouvelle tâche</button>
                    <button type="button" className={`main-button secondary ${showThemeForm ? "active" : ""}`} onClick={handleToggleThemeForm}>✦ Créer un thème</button>
                    <button type="button" className={`main-button secondary ${showThemesList ? "active" : ""}`} onClick={() => setShowThemesList(prev => !prev)}>{showThemesList ? "Masquer les thèmes" : `Voir les thèmes · ${uniqueThemes.length}`}</button>
                </div>

                {/* FORM TÂCHE */}
                {showTaskForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">
                            <div className="theme-field">
                                <label className="theme-label">Nom de la tâche</label>
                                <input
                                    className="theme-input"
                                    value={newTask}
                                    onChange={e => setNewTask(e.target.value)}
                                />
                                <label className="theme-label">
                                    Thèmes <span className="theme-label-hint">(3 max)</span>
                                </label>
                                <div className="theme-multi-picker">
                                    {uniqueThemes.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`theme-multi-btn ${themeIds.includes(t.id) ? "selected" : ""}`}
                                            style={{
                                                borderColor: themeIds.includes(t.id) ? t.color : "rgba(255,255,255,0.1)",
                                                background: themeIds.includes(t.id) ? `${t.color}22` : "transparent",
                                                color: themeIds.includes(t.id) ? t.color : "rgba(255,255,255,0.6)",
                                            }}
                                            onClick={() => toggleThemeSelection(t.id)}
                                            disabled={!themeIds.includes(t.id) && themeIds.length >= 3}
                                        >
                                            {t.emoji} {t.name}
                                            {themeIds.includes(t.id) && <span> ✓</span>}
                                        </button>
                                    ))}
                                </div>
                                {themeIds.length === 3 && (
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
                                        Maximum 3 thèmes atteint
                                    </p>
                                )}
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Priorité</label>
                                <select className="theme-select" value={priority} onChange={e => setPriority(e.target.value)}>
                                    <option value="Low">Basse</option>
                                    <option value="Medium">Moyenne</option>
                                    <option value="High">Haute</option>
                                </select>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Fréquence</label>
                                <select className="theme-select" value={frequency} onChange={e => setFrequency(e.target.value)}>
                                    <option value="daily">Chaque jour</option>
                                    <option value="weekly">Chaque semaine</option>
                                    <option value="monthly">Chaque mois</option>
                                    <option value="once">Une seule fois</option>
                                </select>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Échéance</label>
                                <select
                                    className="theme-select"
                                    value={deadlineMode}
                                    onChange={e => {
                                        const mode = e.target.value as "until_cancelled" | "date"
                                        setDeadlineMode(mode)
                                        if (mode === "until_cancelled") setDeadline("")
                                    }}
                                >
                                    <option value="until_cancelled">Chaque jour jusqu’à annulation</option>
                                    <option value="date">Jusqu’à une date précise</option>
                                </select>
                                {deadlineMode === "date" ? (
                                    <input className="theme-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                                ) : null}
                                <small className="theme-label-hint">
                                    Sans date limite, la tâche reste dans ta liste chaque jour jusqu’à ce que tu l’archives.
                                </small>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Note (facultatif)</label>
                                <input className="theme-input" value={note} onChange={e => setNote(e.target.value)} />
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Type de tâche</label>
                                <select
                                    className="theme-select"
                                    value={completionTarget === 1 && frequency === "once" ? "once" : "recurring"}
                                    onChange={e => {
                                        if (e.target.value === "once") { setFrequency("once"); setCompletionTarget(1) }
                                        else { setFrequency("daily"); setCompletionTarget(1) }
                                    }}
                                >
                                    <option value="once">À faire une seule fois</option>
                                    <option value="recurring">Récurrente — revient chaque jour</option>
                                </select>
                            </div>

                            {frequency !== "once" && (
                                <div className="theme-field">
                                    <label className="theme-label">Nombre de répétitions par jour</label>
                                    <input
                                        className="theme-input"
                                        type="number" min={1} max={30}
                                        value={completionTarget}
                                        onChange={e => setCompletionTarget(Number(e.target.value))}
                                    />
                                </div>
                            )}

                            <button className="main-button" onClick={handleCreateTask}>
                                Créer la tâche
                            </button>
                        </div>
                    </div>
                )}

                {/* FORM THÈME */}
                {showThemeForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">
                            <input className="theme-input" placeholder="Nom du thème" value={themeName} onChange={e => setThemeName(e.target.value)} />
                            <input className="theme-input" placeholder="Emoji" value={themeEmoji} onChange={e => setThemeEmoji(e.target.value)} />
                            <div className="color-picker">
                                {["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"].map(color => (
                                    <div
                                        key={color}
                                        className={`color-dot ${themeColor === color ? "selected" : ""}`}
                                        style={{ background: color }}
                                        onClick={() => setThemeColor(color)}
                                    />
                                ))}
                            </div>
                            <button className="main-button" onClick={handleCreateTheme}>Créer le thème</button>
                        </div>
                    </div>
                )}

                <section className="dashboard-task-list-section">
                    <div className="dashboard-list-heading">
                        <div>
                            <p className="dashboard-eyebrow">PASSE À L’ACTION</p>
                            <h2>Mes tâches</h2>
                            <p className="dashboard-list-subtitle">{visibleTasks.length} résultat{visibleTasks.length > 1 ? "s" : ""} · coche une tâche quand tu l’as terminée.</p>
                        </div>
                        <div className="dashboard-task-filters" role="group" aria-label="Filtrer les tâches">
                            <button type="button" className={taskFilter === "all" ? "active" : ""} aria-pressed={taskFilter === "all"} onClick={() => setTaskFilter("all")}>Toutes <span>{searchedTasks.length}</span></button>
                            <button type="button" className={taskFilter === "pending" ? "active" : ""} aria-pressed={taskFilter === "pending"} onClick={() => setTaskFilter("pending")}>À faire <span>{searchedTasks.filter(task => !dailyState.get(task.id)?.done_today).length}</span></button>
                            <button type="button" className={taskFilter === "done" ? "active" : ""} aria-pressed={taskFilter === "done"} onClick={() => setTaskFilter("done")}>Terminées <span>{searchedTasks.filter(task => dailyState.get(task.id)?.done_today).length}</span></button>
                        </div>
                    </div>
                </section>

                {visibleTasks.length === 0 && !taskSearch && (
                    <div className="dashboard-empty-state">
                        <span className="dashboard-empty-icon" aria-hidden="true">{taskFilter === "done" ? "✦" : "☀"}</span>
                        <h3>{taskFilter === "done" ? "Pas encore de tâche terminée" : taskFilter === "pending" ? "Tout est à jour !" : "Ton espace est prêt"}</h3>
                        <p>{taskFilter === "done" ? "Les tâches cochées aujourd’hui apparaîtront ici." : taskFilter === "pending" ? "Tu as terminé toutes tes tâches du moment." : "Ajoute ta première tâche pour organiser ta journée."}</p>
                        {taskFilter === "all" && <button type="button" className="main-button" onClick={handleToggleTaskForm}>＋ Créer ma première tâche</button>}
                    </div>
                )}

                {taskSearch && visibleTasks.length === 0 && (
                    <div className="task-search-empty">Aucune tâche ne correspond à « {taskSearch} ». Essaie un autre mot ou efface la recherche.</div>
                )}

                {visibleTasks.map(task => {
                    const state = dailyState.get(task.id);
                    const todayCount = state?.today_count ?? 0;
                    const doneToday = state?.done_today ?? false;

                    // Récupère les thèmes (nouveau système ou ancien)
                    const rawTaskThemes =
                        task.themes && task.themes.length > 0
                            ? task.themes
                            : task.theme_name
                                ? [{
                                    id: task.theme_id,
                                    name: task.theme_name,
                                    emoji: task.theme_emoji,
                                    color: task.theme_color ?? "#ffffff"
                                }]
                                : []
                    const taskThemes = rawTaskThemes.filter((theme, index, all) =>
                        all.findIndex(other =>
                            (theme.id != null && other.id === theme.id) ||
                            normalizeThemeName(other.name) === normalizeThemeName(theme.name)
                        ) === index
                    )

                    return (
                        <div
                            key={task.id}
                            className={`task dashboard-task-card ${doneToday ? "task-done" : ""}`}
                        >
                            <div className="task-content">

                <span className="task-title">
                    {task.title}
                </span>
                                <span className="dashboard-task-subline">{doneToday ? "Terminée pour aujourd’hui" : task.deadline ? `Échéance : ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(task.deadline))}` : "À ton rythme, une étape à la fois"}</span>

                                <div className="task-meta">

                    <span className={`badge priority-${task.priority?.toLowerCase()}`}>
                        {task.priority === "High" ? "Haute" : task.priority === "Low" ? "Basse" : "Moyenne"}
                    </span>

                                    <span className={`badge type-${task.frequency}`}>
                        {({ daily: "Quotidienne", weekly: "Hebdomadaire", monthly: "Mensuelle", once: "Ponctuelle" } as Record<string, string>)[task.frequency] ?? task.frequency}
                    </span>

                                    {task.completion_target > 1 && (
                                        <span className="badge">
                            {todayCount} / {task.completion_target}
                        </span>
                                    )}

                                    {taskThemes.map(theme => (
                                        <span
                                            key={theme.id}
                                            className="task-theme"
                                            style={{
                                                border: `1px solid ${theme.color}`,
                                                background: `${theme.color}20`,
                                                color: theme.color
                                            }}
                                        >
                            {theme.emoji} {theme.name}
                        </span>
                                    ))}

                                </div>

                            </div>

                            <div className="task-actions">

                                <button
                                    type="button"
                                    className={`task-btn done-btn ${doneToday ? "active" : ""}`}
                                    aria-label={doneToday ? `Marquer ${task.title} comme non terminée` : `Terminer ${task.title}`}
                                    title={doneToday ? "Annuler la validation" : "Marquer comme terminée"}
                                    onClick={() => toggleDone(task.id)}
                                >
                                    <span className="task-action-icon" aria-hidden="true">{doneToday ? "↩" : "✓"}</span>
                                    <span className="task-action-label">{doneToday ? "Annuler" : "Terminer"}</span>
                                </button>

                                <button
                                    type="button"
                                    className="task-btn archive-btn"
                                    aria-label={`Archiver ${task.title}`}
                                    onClick={() => archiveTask(task.id)}
                                    title="Archiver"
                                >
                                    <span className="task-action-icon" aria-hidden="true">▣</span>
                                    <span className="task-action-label">Archiver</span>
                                </button>

                                <button
                                    type="button"
                                    className="task-btn delete-btn"
                                    aria-label={`Supprimer ${task.title}`}
                                    title={`Supprimer ${task.title}`}
                                    onClick={() => deleteTask(task.id)}
                                >
                                    <span className="task-action-icon" aria-hidden="true">×</span>
                                    <span className="task-action-label">Supprimer</span>
                                </button>

                            </div>
                        </div>
                    );
                })}

                {/* THÈMES — regroupés par nom pour éviter les doublons visuels */}
                {showThemesList && (
                    <section className="themes-section" aria-label="Mes thèmes">
                        <header className="themes-section-header">
                            <div>
                                <p className="dashboard-eyebrow">ORGANISE TON ESPACE</p>
                                <h2>Mes thèmes</h2>
                                <p className="themes-section-subtitle">
                                    {themeGroups.length} thème{themeGroups.length !== 1 ? "s" : ""} unique{themeGroups.length !== 1 ? "s" : ""} pour organiser tes tâches.
                                </p>
                            </div>
                            <span className="themes-total-pill">{themeGroups.length} au total</span>
                        </header>

                        {themeGroups.length === 0 ? (
                            <div className="dashboard-theme-empty">
                                <span className="themes-empty-icon" aria-hidden="true">✦</span>
                                <strong>Aucun thème pour le moment</strong>
                                <span>Crée un thème pour classer tes tâches et suivre ta progression.</span>
                                <button type="button" className="main-button" onClick={handleToggleThemeForm}>Créer un thème</button>
                            </div>
                        ) : (
                            <div className="themes-grid">
                                {themeGroups.map(({ theme, ids, key }) => {
                                    const themeTasks = tasks.filter(task =>
                                        (task.themes && task.themes.some(item => ids.includes(item.id))) ||
                                        (task.theme_id != null && ids.includes(Number(task.theme_id)))
                                    )
                                    const done = themeTasks.filter(task => dailyState.get(task.id)?.done_today).length
                                    const progress = themeTasks.length ? Math.round(done / themeTasks.length * 100) : 0
                                    const duplicates = ids.length - 1

                                    return (
                                        <article
                                            key={key}
                                            className="theme-card"
                                            style={{ "--theme-color": theme.color || "#6366f1" } as CSSProperties}
                                        >
                                            <div className="theme-card-top">
                                                <span className="theme-emoji" aria-hidden="true">{theme.emoji || "✦"}</span>
                                                <span className="theme-task-count">{themeTasks.length} tâche{themeTasks.length !== 1 ? "s" : ""}</span>
                                            </div>
                                            <div className="theme-info">
                                                <h3 className="theme-name">{theme.name}</h3>
                                                <p className="theme-stats">{done} terminée{done !== 1 ? "s" : ""} aujourd’hui</p>
                                            </div>
                                            <div className="theme-progress-track" role="progressbar" aria-label={`Progression du thème ${theme.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                                                <span style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="theme-card-footer">
                                                <span>{progress}% accompli</span>
                                                {duplicates > 0 && <span className="theme-duplicate-hint">{duplicates} doublon{duplicates > 1 ? "s" : ""} regroupé{duplicates > 1 ? "s" : ""}</span>}
                                            </div>
                                            <button
                                                type="button"
                                                className="theme-delete-btn"
                                                aria-label={`Supprimer le thème ${theme.name} et ses doublons`}
                                                title={duplicates > 0 ? `Supprimer ce thème et ses ${duplicates} doublon(s)` : `Supprimer ${theme.name}`}
                                                onClick={() => {
                                                    if (window.confirm(duplicates > 0
                                                        ? `Supprimer « ${theme.name} » et ses ${duplicates} doublon(s) ? Les tâches resteront, mais cette association de thème sera retirée.`
                                                        : `Supprimer le thème « ${theme.name} » ? Les tâches resteront, mais cette association de thème sera retirée.`)) {
                                                        void Promise.all(ids.map(id => handleDeleteTheme(id)))
                                                    }
                                                }}
                                            >
                                                <span aria-hidden="true">×</span> Supprimer
                                            </button>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )}

            </main>
        </div>
    )
}