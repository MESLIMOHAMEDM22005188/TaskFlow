import "../assets/css/communaute.css"
import { useCommunaute } from "../services/Communaute"
import type { Group } from "../services/taskService"

const CROWNS = ["👑", "🥈", "🥉"]

const GROUP_CATEGORIES = [
    { value: "general", label: "💬 Général" },
    { value: "productivity", label: "💼 Productivité" },
    { value: "health", label: "💪 Santé" },
    { value: "mental", label: "🧠 Mental" },
    { value: "support", label: "🤝 Soutien" },
    { value: "sport", label: "🏃 Sport" },
    { value: "learning", label: "📚 Apprentissage" },
]

const GROUP_EMOJIS = ["💬", "💪", "🧠", "🎯", "🤝", "📚", "🏃", "🎮", "🌱", "🔥", "⚡", "🦋"]

export default function Communaute() {

    const {
        navigate, loading,
        activeTab, setActiveTab,
        activeGroupId,
        posts, groups, leaderboard,
        newPost, setNewPost,
        postType, setPostType,
        isAnonymous, setIsAnonymous,
        showPostForm, setShowPostForm,
        openCommentsPostId,
        comments,
        newComment, setNewComment,
        commentAnonymous, setCommentAnonymous,
        showGroupForm, setShowGroupForm,
        groupName, setGroupName,
        groupDesc, setGroupDesc,
        groupEmoji, setGroupEmoji,
        groupCategory, setGroupCategory,
        groupPrivate, setGroupPrivate,
        handleCreatePost,
        handleDeletePost,
        handleLike,
        handleOpenComments,
        handleCreateComment,
        handleJoinGroup,
        handleCreateGroup,
        handleOpenGroup,
        handleBackToGroups,
        getDivisionFromXp,
        formatDate,
    } = useCommunaute()

    if (loading) return <div className="communaute-page"><div className="communaute-loading">Chargement...</div></div>

    const currentGroup = groups.find(g => g.id === activeGroupId)

    return (
        <div className="communaute-page">

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
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                    </div>
                </nav>
            </header>

            <main className="communaute-main">

                {/* ONGLETS PRINCIPAUX */}
                <div className="communaute-tabs">
                    <button
                        className={`comm-tab ${activeTab === "feed" ? "active" : ""}`}
                        onClick={() => setActiveTab("feed")}
                    >
                        🌐 Feed
                    </button>
                    <button
                        className={`comm-tab ${activeTab === "anonymous" ? "active anon" : ""}`}
                        onClick={() => setActiveTab("anonymous")}
                    >
                        🎭 Espace anonyme
                    </button>
                    <button
                        className={`comm-tab ${activeTab === "groups" ? "active" : ""}`}
                        onClick={() => setActiveTab("groups")}
                    >
                        👥 Groupes
                    </button>
                </div>

                {/* ===========================
                    VUE GROUPES — LISTE
                =========================== */}
                {activeTab === "groups" && !activeGroupId && (
                    <div className="groups-view">

                        <div className="groups-header">
                            <div>
                                <h2 className="communaute-section-title">👥 Groupes</h2>
                                <p className="groups-subtitle">Rejoins une communauté ou crée la tienne</p>
                            </div>
                            <button
                                className={`main-button ${showGroupForm ? "active" : ""}`}
                                onClick={() => setShowGroupForm(!showGroupForm)}
                            >
                                {showGroupForm ? "✕ Fermer" : "+ Créer un groupe"}
                            </button>
                        </div>

                        {/* Formulaire création groupe */}
                        {showGroupForm && (
                            <div className="group-form-wrapper">
                                <div className="group-form">
                                    <h3 className="group-form-title">Nouveau groupe</h3>

                                    {/* Sélecteur emoji */}
                                    <div className="theme-field">
                                        <label className="theme-label">Emoji</label>
                                        <div className="group-emoji-picker">
                                            {GROUP_EMOJIS.map(e => (
                                                <button
                                                    key={e}
                                                    className={`group-emoji-btn ${groupEmoji === e ? "selected" : ""}`}
                                                    onClick={() => setGroupEmoji(e)}
                                                >
                                                    {e}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="theme-field">
                                        <label className="theme-label">Nom du groupe</label>
                                        <input
                                            className="theme-input"
                                            placeholder="Ex: Runners du matin..."
                                            value={groupName}
                                            onChange={e => setGroupName(e.target.value)}
                                        />
                                    </div>

                                    <div className="theme-field">
                                        <label className="theme-label">Description <span className="theme-label-hint">(optionnel)</span></label>
                                        <input
                                            className="theme-input"
                                            placeholder="De quoi parle ce groupe ?"
                                            value={groupDesc}
                                            onChange={e => setGroupDesc(e.target.value)}
                                        />
                                    </div>

                                    <div className="habit-form-row">
                                        <div className="theme-field">
                                            <label className="theme-label">Catégorie</label>
                                            <select
                                                className="theme-select"
                                                value={groupCategory}
                                                onChange={e => setGroupCategory(e.target.value)}
                                            >
                                                {GROUP_CATEGORIES.map(c => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="theme-field">
                                            <label className="theme-label">Visibilité</label>
                                            <div className="habit-private-row" style={{ marginTop: 8 }}>
                                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Privé</span>
                                                <label className="switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={groupPrivate}
                                                        onChange={e => setGroupPrivate(e.target.checked)}
                                                    />
                                                    <span className="slider" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="main-button" onClick={handleCreateGroup}>
                                        Créer le groupe
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Grille des groupes */}
                        <div className="groups-grid">
                            {groups.map((group: Group) => (
                                <div
                                    key={group.id}
                                    className={`group-card ${group.is_member ? "joined" : ""}`}
                                    onClick={() => group.is_member && handleOpenGroup(group.id)}
                                >
                                    <div className="group-card-top">
                                        <div className="group-card-emoji">{group.emoji}</div>
                                        <div className="group-card-info">
                                            <h3 className="group-card-name">{group.name}</h3>
                                            <span className="group-card-category">
                                                {GROUP_CATEGORIES.find(c => c.value === group.category)?.label ?? group.category}
                                            </span>
                                        </div>
                                        {group.is_private ? <span className="group-private-badge">🔒</span> : null}
                                    </div>

                                    {group.description && (
                                        <p className="group-card-desc">{group.description}</p>
                                    )}

                                    <div className="group-card-stats">
                                        <span>👥 {group.member_count} membre{group.member_count !== 1 ? "s" : ""}</span>
                                        <span>💬 {group.post_count} post{group.post_count !== 1 ? "s" : ""}</span>
                                    </div>

                                    <div className="group-card-actions">
                                        {group.is_member ? (
                                            <>
                                                <button
                                                    className="group-btn enter"
                                                    onClick={e => { e.stopPropagation(); handleOpenGroup(group.id) }}
                                                >
                                                    → Entrer
                                                </button>
                                                <button
                                                    className="group-btn leave"
                                                    onClick={e => { e.stopPropagation(); handleJoinGroup(group.id) }}
                                                >
                                                    Quitter
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="group-btn join"
                                                onClick={e => { e.stopPropagation(); handleJoinGroup(group.id) }}
                                            >
                                                + Rejoindre
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {groups.length === 0 && (
                                <div className="communaute-empty" style={{ gridColumn: "1/-1" }}>
                                    Aucun groupe encore — sois le premier à en créer un !
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===========================
                    VUE FEED D'UN GROUPE
                =========================== */}
                {activeTab === "groups" && activeGroupId && currentGroup && (
                    <div className="communaute-layout">
                        <div className="communaute-feed">

                            <div className="group-feed-header">
                                <button className="group-back-btn" onClick={handleBackToGroups}>
                                    ← Groupes
                                </button>
                                <div className="group-feed-title">
                                    <span className="group-feed-emoji">{currentGroup.emoji}</span>
                                    <div>
                                        <h2 className="communaute-section-title" style={{ margin: 0 }}>{currentGroup.name}</h2>
                                        {currentGroup.description && (
                                            <p className="group-feed-desc">{currentGroup.description}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className={`main-button ${showPostForm ? "active" : ""}`}
                                    onClick={() => setShowPostForm(!showPostForm)}
                                >
                                    ✍️ Poster
                                </button>
                            </div>

                            {showPostForm && (
                                <PostForm
                                    newPost={newPost} setNewPost={setNewPost}
                                    postType={postType} setPostType={setPostType}
                                    isAnonymous={false}
                                    showAnonymousToggle={false}
                                    onSubmit={handleCreatePost}
                                />
                            )}

                            <PostList
                                posts={posts}
                                openCommentsPostId={openCommentsPostId}
                                comments={comments}
                                newComment={newComment} setNewComment={setNewComment}
                                commentAnonymous={commentAnonymous} setCommentAnonymous={setCommentAnonymous}
                                onLike={handleLike}
                                onDelete={handleDeletePost}
                                onOpenComments={handleOpenComments}
                                onCreateComment={handleCreateComment}
                                getDivisionFromXp={getDivisionFromXp}
                                formatDate={formatDate}
                                isAnonymousTab={false}
                            />
                        </div>

                        <div className="communaute-sidebar">
                            <h2 className="communaute-section-title">🏆 Top membres</h2>
                            <p className="leaderboard-subtitle">Ce groupe cette semaine</p>
                            {leaderboard.map((user, index) => (
                                <div key={user.id} className={`leaderboard-row ${index < 3 ? "top3" : ""}`}>
                                    <span className="leaderboard-rank">{index < 3 ? CROWNS[index] : `#${index + 1}`}</span>
                                    <img src={user.avatar_url ?? "https://i.pravatar.cc/32"} alt="avatar" className="leaderboard-avatar" />
                                    <div className="leaderboard-info">
                                        <span className="leaderboard-username">{user.username ?? "Anonyme"}</span>
                                        <span className="leaderboard-division">{getDivisionFromXp(user.xp)}</span>
                                    </div>
                                    <div className="leaderboard-xp">
                                        <span>{user.xp.toLocaleString()} XP</span>
                                        <span className="leaderboard-tasks">{user.tasks_this_week} tâches</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===========================
                    VUE FEED GÉNÉRAL + ANONYME
                =========================== */}
                {(activeTab === "feed" || activeTab === "anonymous") && (
                    <div className="communaute-layout">
                        <div className="communaute-feed">

                            {/* Banner espace anonyme */}
                            {activeTab === "anonymous" && (
                                <div className="anon-banner">
                                    <span className="anon-banner-icon">🎭</span>
                                    <div>
                                        <strong>Espace anonyme</strong>
                                        <p>Ici, personne ne sait qui tu es. Partage librement, sans jugement. Un pseudo aléatoire te sera attribué à chaque post.</p>
                                    </div>
                                </div>
                            )}

                            <div className="feed-header">
                                <h2 className="communaute-section-title">
                                    {activeTab === "anonymous" ? "🎭 Posts anonymes" : "Feed"}
                                </h2>
                                <button
                                    className={`main-button ${showPostForm ? "active" : ""}`}
                                    onClick={() => setShowPostForm(!showPostForm)}
                                >
                                    {activeTab === "anonymous" ? "🎭 Poster anonymement" : "✍️ Poster"}
                                </button>
                            </div>

                            {showPostForm && (
                                <PostForm
                                    newPost={newPost} setNewPost={setNewPost}
                                    postType={postType} setPostType={setPostType}
                                    isAnonymous={activeTab === "anonymous" ? true : isAnonymous}
                                    setIsAnonymous={activeTab === "anonymous" ? undefined : setIsAnonymous}
                                    showAnonymousToggle={activeTab === "feed"}
                                    onSubmit={handleCreatePost}
                                />
                            )}

                            <PostList
                                posts={posts}
                                openCommentsPostId={openCommentsPostId}
                                comments={comments}
                                newComment={newComment} setNewComment={setNewComment}
                                commentAnonymous={commentAnonymous} setCommentAnonymous={setCommentAnonymous}
                                onLike={handleLike}
                                onDelete={handleDeletePost}
                                onOpenComments={handleOpenComments}
                                onCreateComment={handleCreateComment}
                                getDivisionFromXp={getDivisionFromXp}
                                formatDate={formatDate}
                                isAnonymousTab={activeTab === "anonymous"}
                            />
                        </div>

                        {/* Sidebar leaderboard */}
                        {activeTab === "feed" && (
                            <div className="communaute-sidebar">
                                <h2 className="communaute-section-title">🏆 Leaderboard</h2>
                                <p className="leaderboard-subtitle">Top 10 cette semaine</p>
                                {leaderboard.map((user, index) => (
                                    <div key={user.id} className={`leaderboard-row ${index < 3 ? "top3" : ""}`}>
                                        <span className="leaderboard-rank">{index < 3 ? CROWNS[index] : `#${index + 1}`}</span>
                                        <img src={user.avatar_url ?? "https://i.pravatar.cc/32"} alt="avatar" className="leaderboard-avatar" />
                                        <div className="leaderboard-info">
                                            <span className="leaderboard-username">{user.username ?? "Anonyme"}</span>
                                            <span className="leaderboard-division">{getDivisionFromXp(user.xp)}</span>
                                        </div>
                                        <div className="leaderboard-xp">
                                            <span>{user.xp.toLocaleString()} XP</span>
                                            <span className="leaderboard-tasks">{user.tasks_this_week} tâches</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Raccourcis groupes dans la sidebar */}
                                <div className="sidebar-groups">
                                    <h3 className="sidebar-groups-title">Mes groupes</h3>
                                    {groups.filter(g => g.is_member).length === 0 && (
                                        <p className="sidebar-groups-empty">Rejoins un groupe !</p>
                                    )}
                                    {groups.filter(g => g.is_member).map(g => (
                                        <div key={g.id} className="sidebar-group-row" onClick={() => handleOpenGroup(g.id)}>
                                            <span>{g.emoji}</span>
                                            <span className="sidebar-group-name">{g.name}</span>
                                            <span className="sidebar-group-count">{g.member_count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "anonymous" && (
                            <div className="communaute-sidebar">
                                <div className="anon-sidebar-info">
                                    <h3>🔒 Confidentialité</h3>
                                    <p>Tes posts anonymes n'affichent ni ton nom, ni ton avatar, ni ton XP.</p>
                                    <p>Un pseudo différent est généré à chaque post.</p>
                                    <p>Même les admins ne peuvent pas associer un post à ton compte.</p>
                                </div>
                                <div className="anon-sidebar-rules">
                                    <h3>📜 Règles</h3>
                                    <ul>
                                        <li>Bienveillance obligatoire</li>
                                        <li>Pas de harcèlement</li>
                                        <li>Partage ce qui te pèse librement</li>
                                        <li>Soutiens les autres</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    )
}

// ================================
// SOUS-COMPOSANTS
// ================================

function PostForm({
                      newPost, setNewPost,
                      postType, setPostType,
                      isAnonymous, setIsAnonymous,
                      showAnonymousToggle,
                      onSubmit,
                  }: {
    newPost: string
    setNewPost: (v: string) => void
    postType: string
    setPostType: (v: string) => void
    isAnonymous: boolean
    setIsAnonymous?: (v: boolean) => void
    showAnonymousToggle: boolean
    onSubmit: () => void
}) {
    return (
        <div className={`post-form ${isAnonymous ? "anon-form" : ""}`}>
            {isAnonymous && (
                <div className="post-form-anon-notice">
                    🎭 Ce post sera publié avec un pseudo aléatoire — personne ne saura que c'est toi.
                </div>
            )}
            <select className="flow-select" value={postType} onChange={e => setPostType(e.target.value)}>
                <option value="free">💬 Message libre</option>
                <option value="task_completed">✅ Tâche complétée</option>
                <option value="objective_reached">🎯 Objectif atteint</option>
            </select>
            <textarea
                className="post-textarea"
                placeholder={isAnonymous
                    ? "Partage librement... personne ne sait que c'est toi 🎭"
                    : "Partage quelque chose avec la communauté..."
                }
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
            />
            {showAnonymousToggle && setIsAnonymous && (
                <div className="post-anon-toggle">
                    <label className="switch">
                        <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                        <span className="slider" />
                    </label>
                    <span className="post-anon-label">
                        🎭 Poster anonymement
                        <span className="post-anon-hint"> — un pseudo sera généré automatiquement</span>
                    </span>
                </div>
            )}
            <button className={`main-button ${isAnonymous ? "anon-btn" : ""}`} onClick={onSubmit}>
                {isAnonymous ? "🎭 Publier anonymement" : "Publier"}
            </button>
        </div>
    )
}

function PostList({
                      posts, openCommentsPostId, comments,
                      newComment, setNewComment,
                      commentAnonymous, setCommentAnonymous,
                      onLike, onDelete, onOpenComments, onCreateComment,
                      getDivisionFromXp, formatDate, isAnonymousTab,
                  }: {
    posts: any[]
    openCommentsPostId: number | null
    comments: Record<number, any[]>
    newComment: string
    setNewComment: (v: string) => void
    commentAnonymous: boolean
    setCommentAnonymous: (v: boolean) => void
    onLike: (id: number) => void
    onDelete: (id: number) => void
    onOpenComments: (id: number) => void
    onCreateComment: (id: number) => void
    getDivisionFromXp: (xp: number) => string
    formatDate: (d: string) => string
    isAnonymousTab: boolean
}) {
    if (posts.length === 0) {
        return <p className="communaute-empty">
            {isAnonymousTab
                ? "Aucun post anonyme encore — sois le premier à partager en toute liberté !"
                : "Aucun post encore — sois le premier !"
            }
        </p>
    }

    return (
        <>
            {posts.map(post => (
                <div key={post.id} className={`post-card ${post.is_anonymous ? "anon-post" : ""}`}>

                    <div className="post-header">
                        <div className="post-user">
                            {post.is_anonymous ? (
                                <div className="post-avatar anon-avatar">🎭</div>
                            ) : (
                                <img
                                    src={post.avatar_url ?? "https://i.pravatar.cc/40"}
                                    alt="avatar"
                                    className="post-avatar"
                                />
                            )}
                            <div>
                                <span className="post-username">
                                    {post.username}
                                    {post.is_anonymous && <span className="post-anon-badge">anonyme</span>}
                                </span>
                                {!post.is_anonymous && (
                                    <span className="post-division">{getDivisionFromXp(post.xp)}</span>
                                )}
                            </div>
                        </div>
                        <div className="post-meta">
                            <span className="post-date">{formatDate(post.created_at)}</span>
                            <button className="post-delete" onClick={() => onDelete(post.id)}>🗑</button>
                        </div>
                    </div>

                    {post.type !== "free" && (
                        <span className="post-type-badge">
                            {post.type === "task_completed" ? "✅ Tâche complétée" : "🎯 Objectif atteint"}
                        </span>
                    )}

                    <p className="post-content">{post.content}</p>

                    <div className="post-actions">
                        <button
                            className={`post-action-btn ${post.liked_by_me ? "liked" : ""}`}
                            onClick={() => onLike(post.id)}
                        >
                            ❤️ {post.likes_count}
                        </button>
                        <button
                            className={`post-action-btn ${openCommentsPostId === post.id ? "active" : ""}`}
                            onClick={() => onOpenComments(post.id)}
                        >
                            💬 {post.comments_count}
                        </button>
                    </div>

                    {openCommentsPostId === post.id && (
                        <div className="comments-section">
                            {(comments[post.id] ?? []).map(c => (
                                <div key={c.id} className={`comment ${c.is_anonymous ? "anon-comment" : ""}`}>
                                    {c.is_anonymous ? (
                                        <div className="comment-avatar anon-avatar" style={{ fontSize: 16 }}>🎭</div>
                                    ) : (
                                        <img src={c.avatar_url ?? "https://i.pravatar.cc/30"} alt="avatar" className="comment-avatar" />
                                    )}
                                    <div className="comment-body">
                                        <span className="comment-username">
                                            {c.username}
                                            {c.is_anonymous && <span className="post-anon-badge">anonyme</span>}
                                        </span>
                                        <p className="comment-content">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="comment-form">
                                <div className="comment-anon-row">
                                    <input
                                        className="comment-input"
                                        placeholder={commentAnonymous ? "Commenter anonymement..." : "Ajouter un commentaire..."}
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && onCreateComment(post.id)}
                                    />
                                    <button className="comment-send" onClick={() => onCreateComment(post.id)}>➤</button>
                                </div>
                                <label className="comment-anon-toggle">
                                    <input
                                        type="checkbox"
                                        checked={commentAnonymous}
                                        onChange={e => setCommentAnonymous(e.target.checked)}
                                    />
                                    <span>🎭 Commenter anonymement</span>
                                </label>
                            </div>
                        </div>
                    )}

                </div>
            ))}
        </>
    )
}