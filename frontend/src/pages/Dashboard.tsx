import "../assets/css/dashboard.css"
import { useDashboard } from "../services/Dashboard"

export function Dashboard() {

    const {
        navigate,
        dark, setDark,
        tasks,
        themes,
        doneTasks,
        newTask, setNewTask,
        priority, setPriority,
        themeId, setThemeId,
        frequency, setFrequency,
        deadline, setDeadline,
        note, setNote,
        themeName, setThemeName,
        themeEmoji, setThemeEmoji,
        themeColor, setThemeColor,
        showTaskForm,
        showThemeForm,
        handleToggleTaskForm,
        handleToggleThemeForm,
        handleCreateTask,
        handleCreateTheme,
        toggleDone,
        deleteTask,
        toggle,
    } = useDashboard()

    return (
        <div className={dark ? "dashboard dark" : "dashboard light"}>

            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    <div className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</div>
                    <div className="nav-item" onClick={() => navigate("/objectifs")}>Objectifs</div>
                    <div className="nav-item" onClick={() => navigate("/flow")}>Flow</div>
                    <div className="nav-item" onClick={() => navigate("/profil")}>Profil</div>
                    <div className="nav-item" onClick={() => navigate("/communaute")}>Communauté</div>
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-item nav-focus">⚡ Focus</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                        <button className="theme-button" onClick={() => toggle(setDark)}>
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
                                    placeholder="Task title..."
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
                                <label className="theme-label">Frequency <span className="theme-label-hint">(daily by default)</span></label>
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
                                <label className="theme-label">Deadline <span className="theme-label-hint">(optional)</span></label>
                                <input
                                    className="theme-input"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Note <span className="theme-label-hint">(optional)</span></label>
                                <input
                                    className="theme-input"
                                    placeholder="Why does this task matter..."
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                            <button className="main-button" onClick={handleCreateTask}>
                                Confirm Task
                            </button>
                        </div>
                    </div>
                )}

                {showThemeForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">
                            <div className="theme-field">
                                <label className="theme-label">Theme name</label>
                                <input
                                    className="theme-input"
                                    placeholder="Sport, Travail, Perso..."
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Icon or emoji</label>
                                <input
                                    className="theme-input"
                                    placeholder="🏋️"
                                    maxLength={2}
                                    value={themeEmoji}
                                    onChange={(e) => setThemeEmoji(e.target.value)}
                                />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Color</label>
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
                            </div>
                            <button className="main-button" onClick={handleCreateTheme}>
                                Create Theme
                            </button>
                        </div>
                    </div>
                )}

                {/* PROGRESS BAR */}
                <div className="progress-wrapper">
                    <div className="progress-header">
                        <span className="progress-label">Total progress</span>
                        <span className="progress-count">{doneTasks.length} / {tasks.length} tasks</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: tasks.length ? `${(doneTasks.length / tasks.length) * 100}%` : "0%" }}
                        />
                    </div>
                </div>

                {/* TASKS depuis la BDD */}
                {tasks.map(task => {
                    const theme = themes.find(t => t.id === task.theme_id)
                    return (
                        <div key={task.id} className={`task ${doneTasks.includes(task.id) ? "task-done" : ""}`}>
                            <div className="task-left">
                                <div className="task-color" style={{ background: theme?.color ?? "#6366f1" }}></div>
                                <div className="task-content">
                                    <span className="task-title">{task.title}</span>
                                    <div className="task-meta">
                                        <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                                        <span className={`badge type-${task.frequency}`}>{task.frequency}</span>
                                        {theme && (
                                            <span className="badge" style={{ background: `${theme.color}20`, color: theme.color }}>
                                                {theme.emoji} {theme.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="task-actions">
                                <button
                                    className={`task-btn done-btn ${doneTasks.includes(task.id) ? "active" : ""}`}
                                    onClick={() => toggleDone(task.id)}
                                >
                                    {doneTasks.includes(task.id) ? "↩ Undone" : "✓ Done"}
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

                {/* THEMES depuis la BDD */}
                <section className="themes">
                    {themes.map(theme => (
                        <div key={theme.id} className="theme-card" style={{ borderLeft: `4px solid ${theme.color}` }}>
                            <div className="theme-top">
                                <span className="theme-name">{theme.emoji} {theme.name}</span>
                                <span className="theme-badge" style={{ color: theme.color }}>
                                    {tasks.filter(t => t.theme_id === theme.id).length} tasks
                                </span>
                            </div>
                            <div className="theme-stats">
                                <span>{tasks.filter(t => t.theme_id === theme.id && doneTasks.includes(t.id)).length} done</span>
                                <span className="dot" style={{ background: theme.color }}></span>
                            </div>
                        </div>
                    ))}
                </section>

            </main>

        </div>
    )
}