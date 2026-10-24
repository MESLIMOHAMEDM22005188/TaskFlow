import "../assets/css/objectifs.css"
import { useState, type CSSProperties } from "react"
import { useObjectifs } from "../services/Objectifs"
import Navbar from "../components/Navbar"

function getDaysLeft(deadline: string | null): number | null {
    if (!deadline) return null
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

function getProgress(current: number, target: number | null): number {
    if (!target) return 0
    return Math.max(0, Math.min((current / target) * 100, 100))
}

function normalizeTitle(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr-FR")
}

const CATEGORY_COLORS: Record<string, string> = {
    "Santé & bien-être": "#22c55e",
    "Sport": "#f97316",
    "Études": "#3b82f6",
    "Productivité": "#8b5cf6",
    "Lecture & culture": "#d946ef",
    "Langues": "#06b6d4",
    "Finances": "#eab308",
    "Développement personnel": "#ec4899",
    "Créativité": "#a78bfa",
    "Vie quotidienne": "#14b8a6",
    "Relations": "#fb7185",
    "Numérique": "#60a5fa",
}

function categoryColor(category: string) {
    return CATEGORY_COLORS[category] ?? "#818cf8"
}

export default function Objectifs() {
    const {
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

    const [catalogueQuery, setCatalogueQuery] = useState("")
    const [catalogueCategory, setCatalogueCategory] = useState("Toutes")
    const [catalogueSort, setCatalogueSort] = useState<"category" | "title" | "shortest" | "longest">("category")

    const categories = Array.from(new Set(templates.map(template => template.category))).sort((a, b) => a.localeCompare(b, "fr"))
    const filteredTemplates = templates
        .filter(template => {
            const matchesCategory = catalogueCategory === "Toutes" || template.category === catalogueCategory
            const query = catalogueQuery.trim().toLocaleLowerCase("fr-FR")
            const matchesQuery = !query || [template.title, template.description, template.category]
                .some(value => value?.toLocaleLowerCase("fr-FR").includes(query))
            return matchesCategory && matchesQuery
        })
        .sort((a, b) => {
            if (catalogueSort === "title") return a.title.localeCompare(b.title, "fr")
            if (catalogueSort === "shortest") return (a.suggested_days ?? Number.MAX_SAFE_INTEGER) - (b.suggested_days ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title, "fr")
            if (catalogueSort === "longest") return (b.suggested_days ?? 0) - (a.suggested_days ?? 0) || a.title.localeCompare(b.title, "fr")
            return a.category.localeCompare(b.category, "fr") || a.title.localeCompare(b.title, "fr")
        })

    if (loading) return <div className="objectifs-page"><Navbar /><main className="objectifs-main"><div className="objectifs-loading"><span className="objectifs-loading-orbit" />Préparation de ton espace objectifs…</div></main></div>

    return (
        <div className="objectifs-page">
            <Navbar />
            <main className="objectifs-main">
                <section className="objectifs-hero">
                    <div className="objectifs-hero-copy">
                        <p className="objectifs-eyebrow">AVANCE À TON RYTHME</p>
                        <h1 className="objectifs-title">Tes objectifs, <span>tes progrès.</span></h1>
                        <p className="objectifs-intro">Transforme tes envies en étapes concrètes. Choisis une idée du catalogue ou crée un objectif qui te ressemble.</p>
                    </div>
                    <div className="objectifs-hero-symbol" aria-hidden="true">✦</div>
                    <div className="objectifs-summary">
                        <article className="objectifs-summary-card summary-active">
                            <span className="objectifs-summary-icon" aria-hidden="true">◎</span>
                            <span className="objectifs-summary-label">En cours</span>
                            <strong>{activeObjectives.length}</strong>
                            <small>objectif{activeObjectives.length !== 1 ? "s" : ""} actif{activeObjectives.length !== 1 ? "s" : ""}</small>
                        </article>
                        <article className="objectifs-summary-card summary-completed">
                            <span className="objectifs-summary-icon" aria-hidden="true">✓</span>
                            <span className="objectifs-summary-label">Accomplis</span>
                            <strong>{completedObjectives.length}</strong>
                            <small>objectif{completedObjectives.length !== 1 ? "s" : ""} terminé{completedObjectives.length !== 1 ? "s" : ""}</small>
                        </article>
                        <article className="objectifs-summary-card summary-catalogue">
                            <span className="objectifs-summary-icon" aria-hidden="true">▦</span>
                            <span className="objectifs-summary-label">Idées à explorer</span>
                            <strong>{templates.length}</strong>
                            <small>propositions disponibles</small>
                        </article>
                    </div>
                </section>

                <div className="objectifs-actions">
                    <button
                        type="button"
                        className={`main-button objectifs-action-primary ${showCreateForm ? "active" : ""}`}
                        onClick={() => { setShowCreateForm(!showCreateForm); setShowCatalogue(false) }}
                    >
                        <span aria-hidden="true">＋</span> Créer un objectif
                    </button>
                    <button
                        type="button"
                        className={`main-button secondary objectifs-action-secondary ${showCatalogue ? "active" : ""}`}
                        onClick={() => { setShowCatalogue(!showCatalogue); setShowCreateForm(false) }}
                    >
                        <span aria-hidden="true">▦</span> Explorer le catalogue <span className="objectifs-action-count">{templates.length}</span>
                    </button>
                </div>

                {showCreateForm && (
                    <section className="objectifs-create-panel">
                        <div className="objectifs-panel-heading">
                            <div>
                                <p className="objectifs-eyebrow">NOUVEAU DÉPART</p>
                                <h2>Créer mon objectif</h2>
                                <p>Définis une direction claire, puis avance petit à petit.</p>
                            </div>
                            <span aria-hidden="true">🎯</span>
                        </div>
                        <div className="objectifs-create-grid">
                            <div className="theme-field">
                                <label className="theme-label" htmlFor="objective-title">Titre</label>
                                <input id="objective-title" className="theme-input" placeholder="Ex. Lire davantage" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label" htmlFor="objective-emoji">Emoji <span className="theme-label-hint">(optionnel)</span></label>
                                <input id="objective-emoji" className="theme-input" placeholder="🎯" maxLength={2} value={emoji} onChange={e => setEmoji(e.target.value)} />
                            </div>
                            <div className="theme-field objectifs-field-wide">
                                <label className="theme-label" htmlFor="objective-description">Description <span className="theme-label-hint">(optionnel)</span></label>
                                <input id="objective-description" className="theme-input" placeholder="Pourquoi cet objectif compte pour toi…" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label" htmlFor="objective-target">Valeur cible <span className="theme-label-hint">(optionnel)</span></label>
                                <input id="objective-target" className="theme-input" type="number" min="1" placeholder="Ex. 20" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label" htmlFor="objective-unit">Unité <span className="theme-label-hint">(optionnel)</span></label>
                                <input id="objective-unit" className="theme-input" placeholder="jours, km, pages…" value={targetUnit} onChange={e => setTargetUnit(e.target.value)} />
                            </div>
                            <div className="theme-field">
                                <label className="theme-label" htmlFor="objective-deadline">Date limite <span className="theme-label-hint">(optionnel)</span></label>
                                <input id="objective-deadline" className="theme-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                            </div>
                        </div>
                        <div className="objectifs-form-footer">
                            <button type="button" className="objectifs-text-button" onClick={() => setShowCreateForm(false)}>Annuler</button>
                            <button type="button" className="main-button" disabled={!title.trim()} onClick={handleCreateObjective}>Créer mon objectif <span aria-hidden="true">↗</span></button>
                        </div>
                    </section>
                )}

                {showCatalogue && (
                    <section className="catalogue objectifs-catalogue-section">
                        <header className="catalogue-heading">
                            <div>
                                <p className="objectifs-eyebrow">TROUVE TON PROCHAIN DÉFI</p>
                                <h2 className="objectifs-section-title">Catalogue d’objectifs</h2>
                                <p className="catalogue-intro">Des idées concrètes, classées par type, à adapter à ton rythme.</p>
                            </div>
                            <span className="catalogue-count-pill">{filteredTemplates.length} / {templates.length} idées</span>
                        </header>

                        <div className="catalogue-toolbar">
                            <label className="catalogue-search-wrap">
                                <span aria-hidden="true">⌕</span>
                                <input
                                    aria-label="Rechercher un objectif"
                                    type="search"
                                    placeholder="Rechercher un objectif, un mot-clé…"
                                    value={catalogueQuery}
                                    onChange={e => setCatalogueQuery(e.target.value)}
                                />
                                {catalogueQuery && <button type="button" aria-label="Effacer la recherche" onClick={() => setCatalogueQuery("")}>×</button>}
                            </label>
                            <label className="catalogue-sort-wrap">
                                <span>Trier par</span>
                                <select aria-label="Trier les objectifs" value={catalogueSort} onChange={e => setCatalogueSort(e.target.value as typeof catalogueSort)}>
                                    <option value="category">Type</option>
                                    <option value="title">Nom A → Z</option>
                                    <option value="shortest">Durée la plus courte</option>
                                    <option value="longest">Durée la plus longue</option>
                                </select>
                            </label>
                        </div>

                        <div className="catalogue-categories" role="group" aria-label="Filtrer par type">
                            <button type="button" className={catalogueCategory === "Toutes" ? "selected" : ""} aria-pressed={catalogueCategory === "Toutes"} onClick={() => setCatalogueCategory("Toutes")}>
                                Tout <span>{templates.length}</span>
                            </button>
                            {categories.map(category => {
                                const count = templates.filter(template => template.category === category).length
                                const color = categoryColor(category)
                                return (
                                    <button
                                        key={category}
                                        type="button"
                                        className={catalogueCategory === category ? "selected" : ""}
                                        aria-pressed={catalogueCategory === category}
                                        style={{ "--category-color": color } as CSSProperties}
                                        onClick={() => setCatalogueCategory(category)}
                                    >
                                        {category} <span>{count}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {filteredTemplates.length === 0 ? (
                            <div className="catalogue-empty">
                                <span aria-hidden="true">⌕</span>
                                <strong>Aucune proposition trouvée</strong>
                                <p>Essaie une autre recherche ou sélectionne un autre type.</p>
                                <button type="button" className="objectifs-text-button" onClick={() => { setCatalogueQuery(""); setCatalogueCategory("Toutes") }}>Réinitialiser les filtres</button>
                            </div>
                        ) : (
                            <div className="catalogue-grid">
                                {filteredTemplates.map(template => {
                                    const color = categoryColor(template.category)
                                    const alreadyActive = activeObjectives.some(objective => normalizeTitle(objective.title) === normalizeTitle(template.title))
                                    return (
                                        <article
                                            key={template.id}
                                            className="catalogue-card"
                                            style={{ "--category-color": color } as CSSProperties}
                                        >
                                            <div className="catalogue-top">
                                                <span className="catalogue-emoji" aria-hidden="true">{template.emoji || "🎯"}</span>
                                                <span className="catalogue-category">{template.category}</span>
                                            </div>
                                            <h3 className="catalogue-title">{template.title}</h3>
                                            <p className="catalogue-desc">{template.description}</p>
                                            <div className="catalogue-meta">
                                                {template.suggested_days && <span><span aria-hidden="true">◷</span> {template.suggested_days} jours conseillés</span>}
                                                {template.target_value != null && <span><span aria-hidden="true">◎</span> {template.target_value.toLocaleString("fr-FR")} {template.target_unit}</span>}
                                            </div>
                                            <button
                                                type="button"
                                                className="main-button catalogue-adopt-button"
                                                disabled={alreadyActive}
                                                onClick={() => handleAdoptTemplate(template.id)}
                                            >
                                                {alreadyActive ? "Déjà dans mes objectifs" : "＋ Ajouter cet objectif"}
                                            </button>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )}

                <section className="objectifs-section">
                    <div className="objectifs-list-heading">
                        <div>
                            <p className="objectifs-eyebrow">CONTINUE SUR TA LANCÉE</p>
                            <h2 className="objectifs-section-title">Objectifs en cours</h2>
                        </div>
                        <span className="objectifs-list-count">{activeObjectives.length} actif{activeObjectives.length !== 1 ? "s" : ""}</span>
                    </div>
                    {activeObjectives.length === 0 && (
                        <div className="objectifs-empty">
                            <span aria-hidden="true">🌱</span>
                            <strong>Tout commence par une première étape.</strong>
                            <p>Crée ton propre objectif ou choisis une idée dans le catalogue.</p>
                            <button type="button" className="main-button" onClick={() => { setShowCatalogue(true); setShowCreateForm(false); window.scrollTo({ top: 0, behavior: "smooth" }) }}>Explorer les idées</button>
                        </div>
                    )}
                    <div className="objectifs-list">
                        {activeObjectives.map(objective => {
                            const progress = getProgress(objective.current_value, objective.target_value)
                            const daysLeft = getDaysLeft(objective.deadline)
                            return (
                                <article key={objective.id} className="objectif-card">
                                    <div className="objectif-top">
                                        <div className="objectif-left">
                                            <span className="objectif-emoji">{objective.emoji ?? "🎯"}</span>
                                            <div className="objectif-copy">
                                                <h3 className="objectif-title">{objective.title}</h3>
                                                {objective.description && <p className="objectif-desc">{objective.description}</p>}
                                            </div>
                                        </div>
                                        {daysLeft !== null && <span className={`objectif-days ${daysLeft <= 7 ? "urgent" : ""}`}>{daysLeft > 0 ? `${daysLeft} j restants` : "Échéance dépassée"}</span>}
                                    </div>
                                    {objective.target_value != null && objective.target_value > 0 && (
                                        <>
                                            <div className="objectif-progress-header">
                                                <span>{objective.current_value.toLocaleString("fr-FR")} / {objective.target_value.toLocaleString("fr-FR")} {objective.target_unit}</span>
                                                <strong>{Math.round(progress)}%</strong>
                                            </div>
                                            <div className="objectif-progress-bar" role="progressbar" aria-label={`Progression de ${objective.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                                                <div className="objectif-progress-fill" style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="objectif-progress-controls">
                                                <button
                                                    type="button"
                                                    className="progress-btn progress-btn-decrement"
                                                    aria-label={`Retirer une unité à ${objective.title}`}
                                                    title="Retirer une unité"
                                                    disabled={Number(objective.current_value || 0) <= 0}
                                                    onClick={() => handleUpdateProgress(objective.id, Math.max(0, Number(objective.current_value || 0) - 1))}
                                                >−</button>
                                                <span>{objective.current_value.toLocaleString("fr-FR")} <small>{objective.target_unit}</small></span>
                                                <button
                                                    type="button"
                                                    className="progress-btn progress-btn-increment"
                                                    aria-label={`Ajouter une unité à ${objective.title}`}
                                                    title="Ajouter une unité"
                                                    onClick={() => handleUpdateProgress(objective.id, Number(objective.current_value || 0) + 1)}
                                                >+</button>
                                            </div>
                                        </>
                                    )}
                                    <div className="objectif-actions">
                                        <button type="button" className="task-btn done-btn" onClick={() => handleAbandon(objective.id)}>Abandonner</button>
                                        <button type="button" className="task-btn delete-btn" aria-label={`Supprimer ${objective.title}`} title="Supprimer" onClick={() => handleDelete(objective.id)}>🗑</button>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                </section>

                {completedObjectives.length > 0 && (
                    <section className="objectifs-section objectifs-completed-section">
                        <div className="objectifs-list-heading">
                            <div>
                                <p className="objectifs-eyebrow">BIEN JOUÉ</p>
                                <h2 className="objectifs-section-title">Objectifs accomplis</h2>
                            </div>
                            <span className="objectifs-list-count completed-count">{completedObjectives.length} terminé{completedObjectives.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="objectifs-list">
                            {completedObjectives.map(objective => (
                                <article key={objective.id} className="objectif-card completed">
                                    <div className="objectif-top">
                                        <div className="objectif-left">
                                            <span className="objectif-emoji">{objective.emoji ?? "🎯"}</span>
                                            <div className="objectif-copy">
                                                <h3 className="objectif-title">{objective.title}</h3>
                                                {objective.description && <p className="objectif-desc">{objective.description}</p>}
                                            </div>
                                        </div>
                                        <span className="objectif-completed-tag">✓ Accompli</span>
                                    </div>
                                    <button type="button" className="task-btn delete-btn" aria-label={`Supprimer ${objective.title}`} title="Supprimer" onClick={() => handleDelete(objective.id)}>🗑</button>
                                </article>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}
