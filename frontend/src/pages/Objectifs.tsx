import "../assets/css/objectifs.css"
import { useObjectifs } from "../services/Objectifs"

function getDaysLeft(deadline: string | null): number | null {
    if (!deadline) return null
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

function getProgress(current: number, target: number | null): number {
    if (!target) return 0
    return Math.min((current / target) * 100, 100)
}
export default function Objectifs() {

    const {
        navigate,
        loading,
        activeObjectives,
        completedObjectives,
        templates,
        showCreateForm, setShowCreateForm,
        showCatalogue, setShowCatalogue,
        title, setTitle,
        description, setDescription,
        emoji, setEmoji,
        targetValue, setTargetValue,
        targetUnit, setTargetUnit,
        deadline, setDeadline,
        handleCreateObjective,
        handleAdoptTemplate,
        handleUpdateProgress,
        handleAbandon,
        handleDelete,
    } = useObjectifs()

    if (loading) return <div className="objectifs-page">Loading...</div>

    return (
        <div className="objectifs-page">

            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    <div className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</div>
                    <div className="nav-item" onClick={() => navigate("/objectifs")}>Objectifs</div>
                    <div className="nav-item" onClick={() => navigate("/flow")}>Flow</div>
                    <div className="nav-item" onClick={() => navigate("/stats")}>Stats</div>
                    <div className="nav-item" onClick={() => navigate("/profil")}>Profil</div>
                    <div className="nav-item" onClick={() => navigate("/communaute")}>Communauté</div>
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                    </div>
                </nav>
            </header>

            <main className="objectifs-main">

                <h1 className="objectifs-title">Objectifs</h1>

                <div className="action-center">
                    <button
                        className={`main-button ${showCreateForm ? "active" : ""}`}
                        onClick={() => { setShowCreateForm(!showCreateForm); setShowCatalogue(false) }}
                    >
                        + Créer un objectif
                    </button>
                    <button
                        className={`main-button secondary ${showCatalogue ? "active" : ""}`}
                        onClick={() => { setShowCatalogue(!showCatalogue); setShowCreateForm(false) }}
                    >
                        📚 Catalogue
                    </button>
                </div>

                {/* FORM CREATION */}
                {showCreateForm && (
                    <div className="theme-create-wrapper">
                        <div className="theme-create">
                            <div className="theme-field">
                                <label className="theme-label">Titre</label>
                                <input className="theme-input" placeholder="Mon objectif..." value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Description <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" placeholder="Pourquoi cet objectif..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Emoji <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" placeholder="🎯" maxLength={2} value={emoji} onChange={e => setEmoji(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Valeur cible <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" type="number" placeholder="100" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Unité <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" placeholder="jours, km, pages..." value={targetUnit} onChange={e => setTargetUnit(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label">Deadline <span className="theme-label-hint">(optionnel)</span></label>
                                <input className="theme-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                            </div>
                            <button className="main-button" onClick={handleCreateObjective}>
                                Confirmer
                            </button>
                        </div>
                    </div>
                )}

                {/* CATALOGUE */}
                {showCatalogue && (
                    <div className="catalogue">
                        <h2 className="objectifs-section-title">Catalogue</h2>
                        <div className="catalogue-grid">
                            {templates.map(t => (
                                <div key={t.id} className="catalogue-card">
                                    <div className="catalogue-top">
                                        <span className="catalogue-emoji">{t.emoji}</span>
                                        <span className="catalogue-category">{t.category}</span>
                                    </div>
                                    <h3 className="catalogue-title">{t.title}</h3>
                                    <p className="catalogue-desc">{t.description}</p>
                                    <div className="catalogue-meta">
                                        {t.suggested_days && <span>⏱ {t.suggested_days} jours</span>}
                                        {t.target_value && <span>🎯 {t.target_value} {t.target_unit}</span>}
                                    </div>
                                    <button className="main-button" onClick={() => handleAdoptTemplate(t.id)}>
                                        Adopter
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* OBJECTIFS ACTIFS */}
                <section className="objectifs-section">
                    <h2 className="objectifs-section-title">En cours ({activeObjectives.length})</h2>
                    {activeObjectives.length === 0 && (
                        <p className="objectifs-empty">Aucun objectif en cours — crée le tien ou adopte un objectif du catalogue !</p>
                    )}
                    {activeObjectives.map(obj => {
                        const progress = getProgress(obj.current_value, obj.target_value)
                        const daysLeft = getDaysLeft(obj.deadline)
                        return (
                            <div key={obj.id} className="objectif-card">
                                <div className="objectif-top">
                                    <div className="objectif-left">
                                        <span className="objectif-emoji">{obj.emoji ?? "🎯"}</span>
                                        <div>
                                            <h3 className="objectif-title">{obj.title}</h3>
                                            {obj.description && <p className="objectif-desc">{obj.description}</p>}
                                        </div>
                                    </div>
                                    {daysLeft !== null && (
                                        <span className={`objectif-days ${daysLeft <= 7 ? "urgent" : ""}`}>
                                            {daysLeft > 0 ? `${daysLeft}j restants` : "Expiré"}
                                        </span>
                                    )}
                                </div>

                                {obj.target_value && (
                                    <>
                                        <div className="objectif-progress-header">
                                            <span>{obj.current_value} / {obj.target_value} {obj.target_unit}</span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <div className="objectif-progress-bar">
                                            <div className="objectif-progress-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                        <div className="objectif-progress-controls">
                                            <button className="progress-btn" onClick={() => handleUpdateProgress(obj.id, Math.max(0, obj.current_value - 1))}>−</button>
                                            <span>{obj.current_value}</span>
                                            <button className="progress-btn" onClick={() => handleUpdateProgress(obj.id, obj.current_value + 1)}>+</button>
                                        </div>
                                    </>
                                )}

                                <div className="objectif-actions">
                                    <button className="task-btn done-btn" onClick={() => handleAbandon(obj.id)}>Abandonner</button>
                                    <button className="task-btn delete-btn" onClick={() => handleDelete(obj.id)}>🗑</button>
                                </div>
                            </div>
                        )
                    })}
                </section>

                {/* OBJECTIFS COMPLÉTÉS */}
                {completedObjectives.length > 0 && (
                    <section className="objectifs-section">
                        <h2 className="objectifs-section-title">Complétés ({completedObjectives.length})</h2>
                        {completedObjectives.map(obj => (
                            <div key={obj.id} className="objectif-card completed">
                                <div className="objectif-top">
                                    <div className="objectif-left">
                                        <span className="objectif-emoji">{obj.emoji ?? "🎯"}</span>
                                        <div>
                                            <h3 className="objectif-title">{obj.title} ✓</h3>
                                            {obj.description && <p className="objectif-desc">{obj.description}</p>}
                                        </div>
                                    </div>
                                </div>
                                <button className="task-btn delete-btn" onClick={() => handleDelete(obj.id)}>🗑</button>
                            </div>
                        ))}
                    </section>
                )}

            </main>

        </div>
    )
}