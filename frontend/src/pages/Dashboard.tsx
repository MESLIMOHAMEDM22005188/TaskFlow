import "../assets/css/dashboard.css"
import { useDashboard } from "../services/Dashboard"
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
        themeId, setThemeId,
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

    const doneTasks = tasks.filter(t => dailyState.get(t.id)?.done_today).length

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

                    <div className="nav-icons">
                        <div className="nav-item nav-notif">
                            🔔 {notifications.length > 0 && (
                            <span className="notif-badge">{notifications.length}</span>
                        )}
                        </div>

                        <button
                            className="theme-button"
                            onClick={() => setDark(prev => !prev)}
                        >
                            {dark ? "Light mode" : "Dark mode"}
                        </button>
                    </div>
                </nav>
            </header>

            <main className="main">

                <h1 className="title">Your workspace</h1>

                <div className="action-center">
                    <button
                        className={`main-button ${showTaskForm ? "active" : ""}`}
                        onClick={handleToggleTaskForm}
                    >
                        Create Task
                    </button>

                    <button
                        className={`main-button secondary ${showThemeForm ? "active" : ""}`}
                        onClick={handleToggleThemeForm}
                    >
                        Create Theme
                    </button>
                </div>

                {showTaskForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">

                            <div className="theme-field">
                                <label className="theme-label">Task title</label>
                                <input
                                    className="theme-input"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                />
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Theme</label>
                                <select
                                    className="theme-select"
                                    value={themeId ?? ""}
                                    onChange={(e) => setThemeId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">No theme</option>
                                    {themes.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.emoji} {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Priority</label>
                                <select
                                    className="theme-select"
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Frequency</label>
                                <select
                                    className="theme-select"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="once">One-time</option>
                                </select>
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Deadline</label>
                                <input
                                    className="theme-input"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Note</label>
                                <input
                                    className="theme-input"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>

                            <div className="theme-field">
                                <label className="theme-label">Type de tâche</label>
                                <select
                                    className="theme-select"
                                    value={completionTarget === 1 && frequency === "once" ? "once" : "recurring"}
                                    onChange={(e) => {
                                        if (e.target.value === "once") {
                                            setFrequency("once")
                                            setCompletionTarget(1)
                                        } else {
                                            setFrequency("daily")
                                            setCompletionTarget(1)
                                        }
                                    }}
                                >
                                    <option value="once">One-time — à faire une fois</option>
                                    <option value="recurring">Récurrente — revient chaque jour</option>
                                </select>
                            </div>

                            {/* Affiche le compteur seulement si récurrente */}
                            {frequency !== "once" && (
                                <>
                                    <div className="theme-field">
                                        <label className="theme-label">
                                            Nombre de fois par jour
                                        </label>
                                        <input
                                            className="theme-input"
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={completionTarget}
                                            onChange={(e) => setCompletionTarget(Number(e.target.value))}
                                        />
                                    </div>
                                </>
                            )}
                            <button className="main-button" onClick={handleCreateTask}>
                                Confirm Task
                            </button>

                        </div>
                    </div>
                )}

                {showThemeForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">

                            <input
                                className="theme-input"
                                placeholder="Theme name"
                                value={themeName}
                                onChange={(e) => setThemeName(e.target.value)}
                            />

                            <input
                                className="theme-input"
                                placeholder="Emoji"
                                value={themeEmoji}
                                onChange={(e) => setThemeEmoji(e.target.value)}
                            />

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

                            <button className="main-button" onClick={handleCreateTheme}>
                                Create Theme
                            </button>

                        </div>
                    </div>
                )}

                {/* PROGRESS */}
                <div className="progress-wrapper">
                    <span>{doneTasks} / {tasks.length} done today</span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: tasks.length
                                    ? `${(doneTasks / tasks.length) * 100}%`
                                    : "0%"
                            }}
                        />
                    </div>
                </div>

                {/* TASKS */}
                {tasks.map(task => {
                    const theme = themes.find(t => t.id === task.theme_id)
                    const state = dailyState.get(task.id)
                    const todayCount = state?.today_count ?? 0
                    const doneToday = state?.done_today ?? false

                    return (
                        <div key={task.id} className={`task ${doneToday ? "task-done" : ""}`}>

                            <div className="task-content">
                                <span>{task.title}</span>

                                <div className="task-meta">
                                    <span className={`badge priority-${task.priority?.toLowerCase()}`}>
                                        {task.priority}
                                    </span>

                                    <span className={`badge type-${task.frequency}`}>
                                        {task.frequency}
                                    </span>

                                    {task.completion_target > 1 && (
                                        <span className="badge">
                                            {todayCount} / {task.completion_target}
                                        </span>
                                    )}

                                    {theme && (
                                        <span style={{ color: theme.color }}>
                                            {theme.emoji} {theme.name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="task-actions">
                                <button
                                    className={`task-btn done-btn ${doneToday ? "active" : ""}`}
                                    onClick={() => toggleDone(task.id)}
                                >
                                    {doneToday ? "↩" : "✓"}
                                </button>

                                <button
                                    className="task-btn archive-btn"
                                    onClick={() => archiveTask(task.id)}
                                    title="Archiver"
                                >
                                    🗃
                                </button>

                                <button
                                    className="task-btn delete-btn"
                                    onClick={() => deleteTask(task.id)}
                                >
                                    🗑
                                </button>
                            </div>

                        </div>
                    )
                })}

                {/* THEMES */}
                <section className="themes">
                    {themes.map(theme => {
                        const themeTasks = tasks.filter(t => Number(t.theme_id) === Number(theme.id))
                        const done = themeTasks.filter(t => dailyState.get(t.id)?.done_today).length

                        return (
                            <div key={theme.id} className="theme-card">
                                <div className="theme-card-left">
                                    <span className="theme-emoji">{theme.emoji}</span>
                                    <div className="theme-info">
                                        <span className="theme-name">{theme.name}</span>
                                        <span className="theme-stats">{themeTasks.length} tâches • {done} faites aujourd'hui</span>
                                    </div>
                                </div>
                                <button className="theme-delete-btn" onClick={() => handleDeleteTheme(theme.id)}>
                                    Supprimer
                                </button>
                            </div>
                        )
                    })}
                </section>


            </main>
        </div>
    )
}