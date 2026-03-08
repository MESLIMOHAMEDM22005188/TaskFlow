import { useState } from "react";
import "../assets/css/TaskHome.css";

const DEFAULT_THEME_COLOR = "#1E3A8A";
const MAX_THEMES = 7;

export function TaskView({
  tasks = [],
  addTask,
  deleteTask,
  toggleStatus,
  logout,
  deleteTheme,
  priority,
  setPriority,
  filter,
  setFilter,
  totalTasks,
  completedTasks,
  createTheme,
  themes = [],
  currentTheme,
  onProfile,
}) {

  const [showInput, setShowInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeColor, setNewThemeColor] = useState(DEFAULT_THEME_COLOR);
  const [selectedTheme, setSelectedTheme] = useState("");

  const accentColor = currentTheme?.color || DEFAULT_THEME_COLOR;

  const handleSubmit = () => {
    if (!newTitle.trim()) return;

    addTask({
      title: newTitle,
      priority,
      themeId: selectedTheme || null
    });

    setNewTitle("");
    setShowInput(false);
  };

  const handleSaveTheme = async () => {
    if (!newThemeName.trim()) return;

    await createTheme(newThemeName, newThemeColor);

    setNewThemeName("");
    setNewThemeColor(DEFAULT_THEME_COLOR);
    setShowThemeModal(false);
  };

  const handleDeleteTheme = (themeId) => {
    deleteTheme(themeId);
  };

  const canAddMoreThemes = themes.length < MAX_THEMES;

  console.log("📊 PROGRESS DATA", {
  totalTasks,
  completedTasks,
  percent:
    totalTasks === 0
      ? 0
      : (completedTasks / totalTasks) * 100
});
  return (

    <main className="home">

      {/* HEADER */}

      <header className="topbar">

        <nav className="header-left">
          <button className="theme-btn" onClick={() => setShowThemeModal(true)}>My Themes</button>
          <button className="graph-btn">Chart</button>
          <button className="profile-btn" onClick={onProfile}>Profile</button>
        </nav>

        <button className="logout-btn" onClick={logout}>Logout</button>

      </header>


      {/* MODAL THEMES */}

      {showThemeModal && (

        <aside className="modal-backdrop" onClick={() => setShowThemeModal(false)}>

          <section className="modal" onClick={(e) => e.stopPropagation()}>

            <h2>Manage Themes</h2>

            <section className="theme-previews">

              {themes.length === 0 && <p>No themes yet</p>}

              {themes.map((theme) => (

                <article
                  key={theme.id}
                  className="theme-preview-item"
                  style={{ backgroundColor: theme.color }}
                >

                  <span>{theme.name}</span>

                  <button
                    className="delete-theme-btn"
                    onClick={() => handleDeleteTheme(theme.id)}
                  >
                    Delete
                  </button>

                </article>

              ))}

            </section>

            {canAddMoreThemes && (

              <form className="theme-form">

                <input
                  type="text"
                  placeholder="Theme name"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                />

                <input
                  type="color"
                  value={newThemeColor}
                  onChange={(e) => setNewThemeColor(e.target.value)}
                />

                <button
                  type="button"
                  className="save-theme-btn"
                  onClick={handleSaveTheme}
                >
                  Save Theme
                </button>

              </form>

            )}

            <button
              className="modal-close"
              onClick={() => setShowThemeModal(false)}
            >
              Close
            </button>

          </section>

        </aside>

      )}


      {/* DASHBOARD */}

      <section className="hero">

        <header className="hero-header">

          <h1>TaskFlow</h1>

          <p>
            {completedTasks} / {totalTasks} tasks completed
          </p>

        </header>


        <section className="progress-container">

          <div
            className="progress-bar"
            style={{
              width: totalTasks === 0 ? "0%" : `${(completedTasks / totalTasks) * 100}%`,
              backgroundColor: accentColor
            }}
          />

        </section>


        <section className="hero-controls">

          {!showInput && (

            <section className="hero-actions">

              <button
                className="primary-btn"
                onClick={() => setShowInput(true)}
                style={{ borderColor: accentColor }}
              >
                + Create Task
              </button>

              <button
                className="create-theme-btn"
                onClick={() => setShowThemeModal(true)}
                disabled={!canAddMoreThemes}
              >
                {canAddMoreThemes ? "+ Create Theme" : `Max ${MAX_THEMES} Themes`}
              </button>

            </section>

          )}


          {showInput && (

            <form className="create-task-box">

              <input
                className="create-input"
                placeholder="Enter task..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />

              <select
                className="create-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <select
                className="create-select"
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
              >
                <option value="">No Theme</option>

                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}

              </select>

              <button
                type="button"
                className="create-confirm"
                onClick={handleSubmit}
                style={{ backgroundColor: accentColor }}
              >
                Add
              </button>

              <button
                type="button"
                className="create-cancel"
                onClick={() => setShowInput(false)}
              >
                Cancel
              </button>

            </form>

          )}

        </section>

      </section>



      {/* TASK LIST */}

      <section className="task-list">

        {tasks.length === 0 && <p className="empty-state">No tasks yet</p>}

        {tasks
          ?.filter((t) => t && t.id)
          .map((task) => (

            <article
              key={task.id}
              className="task-card"
              style={{
                borderLeft: task.theme?.color
                  ? `6px solid ${task.theme.color}`
                  : "6px solid #2f2f2f"
              }}
            >

              <h2>{task.title}</h2>

              {task.theme && (

                <p
                  style={{
                    color: task.theme.color,
                    fontWeight: "500",
                    marginTop: "4px"
                  }}
                >
                  Theme: {task.theme.name}
                </p>

              )}

              <p>Status: {task.completed ? "Done" : "To Do"}</p>

              <span className={`priority-badge priority-${task.priority || "medium"}`}>
                {(task.priority || "medium").toUpperCase()}
              </span>

              <footer className="card-actions">

                <button
  onClick={() => {
    console.log("🖱 TOGGLE CLICK", task);
    toggleStatus(task);
  }}
>
  Done
</button>

                <button onClick={() => deleteTask(task.id)}>
                  Delete
                </button>

              </footer>

            </article>

          ))}

      </section>

    </main>

  );

}