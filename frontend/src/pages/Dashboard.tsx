import "../assets/css/dashboard.css"
import { useDashboard} from "../services/Dashboard.ts"

export function Dashboard() {

    const {
        navigate,
        dark, setDark,
        newTask, setNewTask,
        priority, setPriority,
        showTaskForm,
        showThemeForm,
        handleToggleTaskForm,   // ✅ remplace setShowTaskForm
        handleToggleThemeForm,  // ✅ remplace setShowThemeForm
        handleCreateTask,
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
                    <div className="action-center">
                        <input
                            className="task-input"
                            placeholder="Task title..."
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                        />
                        <select
                            className="task-select"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <button className="main-button" onClick={handleCreateTask}>
                            Confirm Task
                        </button>
                    </div>
                )}

                {showThemeForm && (
                    <div className="theme-create">
                        <input className="theme-input" placeholder="Theme name..." />
                        <select className="theme-select">
                            <option value="red">Sport</option>
                            <option value="green">Spiritual</option>
                            <option value="blue">Productivity</option>
                        </select>
                        <button className="main-button">Create Theme</button>
                    </div>
                )}

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

                <div className="task">
                    <div className="task-left">
                        <div className="task-color red"></div>
                        <div className="task-content">
                            <span className="task-title">Workout session</span>
                            <div className="task-meta">
                                <span className="badge priority-high">High</span>
                                <span className="badge type-daily">Daily</span>
                                <span className="badge theme-red">Sport</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="task">
                    <div className="task-left">
                        <div className="task-color green"></div>
                        <div className="task-content">
                            <span className="task-title">Read Quran</span>
                            <div className="task-meta">
                                <span className="badge priority-medium">Medium</span>
                                <span className="badge type-daily">Daily</span>
                                <span className="badge theme-green">Spiritual</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="task">
                    <div className="task-left">
                        <div className="task-color blue"></div>
                        <div className="task-content">
                            <span className="task-title">Review monthly goals</span>
                            <div className="task-meta">
                                <span className="badge priority-low">Low</span>
                                <span className="badge type-monthly">Monthly</span>
                                <span className="badge theme-blue">Productivity</span>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

        </div>
    )
}