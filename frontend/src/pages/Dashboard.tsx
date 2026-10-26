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
        recurrenceInterval,
        setRecurrenceInterval,
        recurrenceDays,
        setRecurrenceDays,
        recurrenceMonthDays,
        setRecurrenceMonthDays,
        recurrenceDates,
        setRecurrenceDates,
        targetPerPeriod,
        setTargetPerPeriod,
        scheduledTime,
        setScheduledTime,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
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
    const [annualDateInput, setAnnualDateInput] = useState("")

    const periodLabels: Record<string, string> = {
        daily: "jour",
        weekly: "semaine",
        monthly: "mois",
        yearly: "an",
    }
    const weekdayOptions = [
        { value: 1, label: "Lun" },
        { value: 2, label: "Mar" },
        { value: 3, label: "Mer" },
        { value: 4, label: "Jeu" },
        { value: 5, label: "Ven" },
        { value: 6, label: "Sam" },
        { value: 7, label: "Dim" },
    ]

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

                            <section aria-label="Planification de la tâche" style={{ display: "grid", gap: 13, border: "1px solid rgba(128,128,128,.24)", borderRadius: 14, padding: 14 }}>
                                <div>
                                    <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Quand faire cette tâche ?</h3>
                                    <p style={{ margin: 0, fontSize: 12, opacity: .68 }}>Choisis une cadence, des jours précis et un objectif de réalisations. Ces réglages sont enregistrés avec la tâche.</p>
                                </div>

                                <label className="theme-field">
                                    <span className="theme-label">Répétition</span>
                                    <select className="theme-select" value={frequency} onChange={event => setFrequency(event.target.value)}>
                                        <option value="once">Une seule fois</option>
                                        <option value="daily">Chaque jour</option>
                                        <option value="weekly">Chaque semaine</option>
                                        <option value="monthly">Chaque mois</option>
                                        <option value="yearly">Chaque année</option>
                                    </select>
                                </label>

                                {frequency !== "once" && (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                                        <label className="theme-field">
                                            <span className="theme-label">Répéter tous les…</span>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                <input className="theme-input" style={{ maxWidth: 100 }} type="number" min={1} max={365} value={recurrenceInterval} onChange={event => setRecurrenceInterval(Math.min(365, Math.max(1, Number(event.target.value) || 1)))} />
                                                <span style={{ opacity: .75 }}>{frequency === "daily" ? "jour(s)" : frequency === "weekly" ? "semaine(s)" : frequency === "monthly" ? "mois" : "an(s)"}</span>
                                            </div>
                                        </label>
                                        {["weekly", "monthly", "yearly"].includes(frequency) && (
                                            <label className="theme-field">
                                                <span className="theme-label">Objectif : fois par {periodLabels[frequency] || "période"}</span>
                                                <input className="theme-input" type="number" min={1} max={60} value={targetPerPeriod} onChange={event => setTargetPerPeriod(Math.min(60, Math.max(1, Number(event.target.value) || 1)))} />
                                            </label>
                                        )}
                                    </div>
                                )}

                                {(frequency === "daily" || frequency === "weekly") && (
                                    <fieldset style={{ margin: 0, border: "1px solid rgba(128,128,128,.24)", borderRadius: 10, padding: 11 }}>
                                        <legend className="theme-label">{frequency === "daily" ? "Jours autorisés (facultatif)" : "Jours de la semaine (facultatif)"}</legend>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                            {weekdayOptions.map(day => {
                                                const selected = recurrenceDays.includes(day.value)
                                                return <button key={day.value} type="button" aria-pressed={selected} onClick={() => setRecurrenceDays(previous => selected ? previous.filter(value => value !== day.value) : [...previous, day.value].sort((a, b) => a - b))} style={{ border: `1px solid ${selected ? "var(--accent-color, #7c6ee6)" : "rgba(128,128,128,.35)"}`, borderRadius: 9, padding: "8px 10px", background: selected ? "rgba(124,110,230,.15)" : "transparent", color: "inherit", cursor: "pointer" }}>{day.label}</button>
                                            })}
                                        </div>
                                        <p style={{ margin: "8px 0 0", fontSize: 11, opacity: .62 }}>Aucun jour sélectionné = tous les jours pour « chaque jour », ou n’importe quel jour de la semaine jusqu’à l’objectif.</p>
                                        {frequency === "weekly" && recurrenceDays.length > 0 && recurrenceDays.length < targetPerPeriod && <p role="status" style={{ margin: "7px 0 0", fontSize: 11, color: "#d97706" }}>Attention : tu as choisi moins de jours que ton objectif par semaine.</p>}
                                    </fieldset>
                                )}

                                {frequency === "monthly" && (
                                    <fieldset style={{ margin: 0, border: "1px solid rgba(128,128,128,.24)", borderRadius: 10, padding: 11 }}>
                                        <legend className="theme-label">Jours du mois (facultatif)</legend>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(34px, 1fr))", gap: 5 }}>
                                            {Array.from({ length: 31 }, (_, index) => index + 1).map(day => {
                                                const selected = recurrenceMonthDays.includes(day)
                                                return <button key={day} type="button" aria-pressed={selected} onClick={() => setRecurrenceMonthDays(previous => selected ? previous.filter(value => value !== day) : [...previous, day].sort((a, b) => a - b))} style={{ border: `1px solid ${selected ? "var(--accent-color, #7c6ee6)" : "rgba(128,128,128,.3)"}`, borderRadius: 7, padding: "6px 0", background: selected ? "rgba(124,110,230,.15)" : "transparent", color: "inherit", cursor: "pointer" }}>{day}</button>
                                            })}
                                        </div>
                                        <p style={{ margin: "8px 0 0", fontSize: 11, opacity: .62 }}>Plusieurs dates possibles. Si aucune n’est choisie, le jour de départ est utilisé ; avec un objectif supérieur à une fois par mois, tu peux choisir n’importe quels jours du mois.</p>
                                        {recurrenceMonthDays.length > 0 && recurrenceMonthDays.length < targetPerPeriod && <p role="status" style={{ margin: "7px 0 0", fontSize: 11, color: "#d97706" }}>Attention : tu as choisi moins de dates que ton objectif par mois.</p>}
                                    </fieldset>
                                )}

                                {frequency === "yearly" && (
                                    <fieldset style={{ margin: 0, border: "1px solid rgba(128,128,128,.24)", borderRadius: 10, padding: 11 }}>
                                        <legend className="theme-label">Dates de l’année (facultatif)</legend>
                                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                                            <input className="theme-input" style={{ maxWidth: 190 }} type="date" value={annualDateInput} onChange={event => setAnnualDateInput(event.target.value)} />
                                            <button type="button" className="main-button secondary" disabled={!annualDateInput} onClick={() => { const monthDay = annualDateInput.slice(5, 10); if (monthDay && !recurrenceDates.includes(monthDay)) setRecurrenceDates(previous => [...previous, monthDay].sort()); setAnnualDateInput(""); }}>Ajouter la date</button>
                                        </div>
                                        {recurrenceDates.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                                            {recurrenceDates.map(date => <button key={date} type="button" onClick={() => setRecurrenceDates(previous => previous.filter(value => value !== date))} title="Retirer cette date" style={{ border: "1px solid rgba(128,128,128,.3)", borderRadius: 999, padding: "6px 9px", background: "rgba(128,128,128,.08)", color: "inherit", cursor: "pointer" }}>{new Date(`2000-${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} ×</button>)}
                                        </div>}
                                        <p style={{ margin: "8px 0 0", fontSize: 11, opacity: .62 }}>Ajoute une ou plusieurs dates récurrentes, par exemple un anniversaire ou un contrôle annuel. Sans date précise, un objectif supérieur à une fois par an est possible n’importe quel jour de l’année.</p>
                                        {recurrenceDates.length > 0 && recurrenceDates.length < targetPerPeriod && <p role="status" style={{ margin: "7px 0 0", fontSize: 11, color: "#d97706" }}>Attention : tu as choisi moins de dates que ton objectif par an.</p>}
                                    </fieldset>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                                    <label className="theme-field">
                                        <span className="theme-label">Heure prévue (facultatif)</span>
                                        <input className="theme-input" type="time" value={scheduledTime} onChange={event => setScheduledTime(event.target.value)} />
                                    </label>
                                    <label className="theme-field">
                                        <span className="theme-label">Commencer à partir du</span>
                                        <input className="theme-input" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
                                    </label>
                                    <label className="theme-field">
                                        <span className="theme-label">Arrêter la répétition le</span>
                                        <input className="theme-input" type="date" min={startDate || undefined} value={endDate} onChange={event => setEndDate(event.target.value)} />
                                    </label>
                                </div>

                                {frequency !== "once" && (
                                    <label className="theme-field">
                                        <span className="theme-label">{frequency === "daily" ? "Objectif de validations par jour" : "Validations nécessaires le même jour (avancé)"}</span>
                                        <input className="theme-input" type="number" min={1} max={30} value={completionTarget} onChange={event => setCompletionTarget(Math.min(30, Math.max(1, Number(event.target.value) || 1)))} />
                                        <span style={{ fontSize: 11, opacity: .62 }}>Pour une habitude comme boire de l’eau plusieurs fois par jour. L’objectif hebdomadaire/mensuel/annuel est réglé séparément.</span>
                                    </label>
                                )}
                            </section>

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
                                const isPeriodGoalReached = ["weekly", "monthly", "yearly"].includes(task.frequency) && Number(task.period_count || 0) >= Number(task.target_per_period || 1)
                                const canValidate = isDone || (task.is_due_today !== false && !isPeriodGoalReached)
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
                                                <span>{formatSchedule(task)}</span>
                                                {["weekly", "monthly", "yearly"].includes(task.frequency) && <span>· Objectif période : {Number(task.period_count || 0)}/{Number(task.target_per_period || 1)}</span>}
                                                {task.scheduled_time && <span>· À {String(task.scheduled_time).slice(0, 5)}</span>}
                                                {task.is_due_today === false && <span style={{ color: "#d97706" }}>· Pas prévue aujourd’hui</span>}
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
                                                title={isDone ? "Annuler la validation du jour" : isPeriodGoalReached ? "Objectif atteint pour cette période" : task.is_due_today === false ? "Cette tâche n’est pas prévue aujourd’hui" : "Valider la tâche effectuée"}
                                                disabled={!canValidate}
                                            >
                                                <span aria-hidden="true">{isDone ? "✓" : "○"}</span>
                                                {isDone ? "Terminée aujourd’hui" : isPeriodGoalReached ? "Objectif atteint" : task.is_due_today === false ? "Pas prévue aujourd’hui" : "Valider"}
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

function formatSchedule(task: {
    frequency: string
    recurrence_interval?: number
    recurrence_days?: number[]
    recurrence_month_days?: number[]
    recurrence_dates?: string[]
    target_per_period?: number
}) {
    if (task.frequency === "once") return "Une seule fois"
    const interval = Math.max(1, Number(task.recurrence_interval || 1))
    const period = task.frequency === "daily" ? "jour" : task.frequency === "weekly" ? "semaine" : task.frequency === "monthly" ? "mois" : "an"
    const cadence = interval === 1
        ? ({ daily: "Chaque jour", weekly: "Chaque semaine", monthly: "Chaque mois", yearly: "Chaque année" } as Record<string, string>)[task.frequency] || "Récurrente"
        : `Tous les ${interval} ${period}`
    const weekdays = ["", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]
    const details: string[] = []
    if ((task.frequency === "daily" || task.frequency === "weekly") && task.recurrence_days?.length) {
        details.push(task.recurrence_days.map(day => weekdays[day]).filter(Boolean).join(", "))
    }
    if (task.frequency === "monthly" && task.recurrence_month_days?.length) {
        details.push(`le ${task.recurrence_month_days.join(", ")}`)
    }
    if (task.frequency === "yearly" && task.recurrence_dates?.length) {
        details.push(task.recurrence_dates.map(value => new Date(`2000-${value}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })).join(", "))
    }
    const target = Math.max(1, Number(task.target_per_period || 1))
    const targetText = task.frequency === "daily" ? "" : `${target} fois/${period}`
    return [cadence, ...details, targetText].filter(Boolean).join(" · ")
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <article style={{ borderRadius: 12, padding: 14, background: "rgba(128,128,128,.08)" }}>
            <p style={{ margin: "0 0 8px", opacity: 0.7, fontSize: 13 }}>{label}</p>
            <strong style={{ fontSize: 26 }}>{value}</strong>
        </article>
    )
}
