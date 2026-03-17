import "../assets/css/dashboard.css"
import { useDashboard } from "../services/Dashboard"  // ✅ pas de .ts

export function Dashboard() {

    const {
        navigate,
        dark, setDark,
        newTask, setNewTask,
        priority, setPriority,
        showTaskForm,
        showThemeForm,
        handleToggleTaskForm,
        handleToggleThemeForm,
        handleCreateTask,
        toggle,
        doneTasks,
        toggleDone,
        deleteTask,
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
                                <select className="theme-select">
                                    <option value="">No theme</option>
                                    <option value="sport">🏋️ Sport</option>
                                    <option value="spiritual">🕌 Spiritual</option>
                                    <option value="productivity">💼 Productivity</option>
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
                                <select className="theme-select">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="once">One-time</option>
                                </select>
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Deadline <span className="theme-label-hint">(optional)</span></label>
                                <input className="theme-input" type="date" />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Note <span className="theme-label-hint">(optional)</span></label>
                                <input className="theme-input" placeholder="Why does this task matter..." />
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
                                <input className="theme-input" placeholder="Sport, Travail, Perso..." />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Icon or emoji</label>
                                <input className="theme-input" placeholder="🏋️" maxLength={2} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Color</label>
                                <div className="color-picker">
                                    {["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"].map(color => (
                                        <div
                                            key={color}
                                            className="color-dot"
                                            style={{ background: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button className="main-button">Create Theme</button>
                        </div>
                    </div>
                )}

                {/* PROGRESS BAR TOTAL */}
                <div className="progress-wrapper">
                    <div className="progress-header">
                        <span className="progress-label">Total progress</span>
                        <span className="progress-count">{doneTasks.length} / 3 tasks</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(doneTasks.length / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* TASKS */}  // ✅ ids en number, plus de doublons en bas
                {[
                    { id: 1, title: "Workout session", color: "red", priority: "priority-high", priorityLabel: "High", type: "type-daily", typeLabel: "Daily", theme: "theme-red", themeLabel: "Sport" },
                    { id: 2, title: "Read Quran", color: "green", priority: "priority-medium", priorityLabel: "Medium", type: "type-daily", typeLabel: "Daily", theme: "theme-green", themeLabel: "Spiritual" },
                    { id: 3, title: "Review monthly goals", color: "blue", priority: "priority-low", priorityLabel: "Low", type: "type-monthly", typeLabel: "Monthly", theme: "theme-blue", themeLabel: "Productivity" },
                ].map(task => (
                    <div key={task.id} className={`task ${doneTasks.includes(task.id) ? "task-done" : ""}`}>
                        <div className="task-left">
                            <div className={`task-color ${task.color}`}></div>
                            <div className="task-content">
                                <span className="task-title">{task.title}</span>
                                <div className="task-meta">
                                    <span className={`badge ${task.priority}`}>{task.priorityLabel}</span>
                                    <span className={`badge ${task.type}`}>{task.typeLabel}</span>
                                    <span className={`badge ${task.theme}`}>{task.themeLabel}</span>
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
                ))}

                <section className="themes">
                    <div className="theme-card red">
                        <div className="theme-top">
                            <span className="theme-name">Sport</span>
                            <span className="theme-badge">High Energy</span>
                        </div>
                        <div className="theme-stats">
                            <span>5 tasks</span>
                            <span className="dot red"></span>
                        </div>
                    </div>
                    <div className="theme-card green">
                        <div className="theme-top">
                            <span className="theme-name">Spiritual</span>
                            <span className="theme-badge">Calm</span>
                        </div>
                        <div className="theme-stats">
                            <span>3 tasks</span>
                            <span className="dot green"></span>
                        </div>
                    </div>
                    <div className="theme-card blue">
                        <div className="theme-top">
                            <span className="theme-name">Productivity</span>
                            <span className="theme-badge">Focus</span>
                        </div>
                        <div className="theme-stats">
                            <span>7 tasks</span>
                            <span className="dot blue"></span>
                        </div>
                    </div>
                </section>

            </main>

        </div>
    )
}