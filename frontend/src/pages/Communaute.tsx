import "../assets/css/communaute.css"
import { useCommunaute } from "../services/Communaute"

const CROWNS = ["👑", "🥈", "🥉"]

export default function Communaute() {

    const {
        navigate,
        loading,
        posts,
        leaderboard,
        newPost, setNewPost,
        postType, setPostType,
        showPostForm, setShowPostForm,
        openCommentsPostId,
        comments,
        newComment, setNewComment,
        handleCreatePost,
        handleDeletePost,
        handleLike,
        handleOpenComments,
        handleCreateComment,
        getDivisionFromXp,
        formatDate,
    } = useCommunaute()

    if (loading) return <div className="communaute-page">Loading...</div>

    return (
        <div className="communaute-page">

            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    <div className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</div>
                    <div className="nav-item" onClick={() => navigate("/objectifs")}>Objectifs</div>
                    <div className="nav-item" onClick={() => navigate("/flow")}>Flow</div>
                    <div className="nav-item" onClick={() => navigate("/profil")}>Profil</div>
                    <div className="nav-item" onClick={() => navigate("/communaute")}>Communauté</div>
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                    </div>
                </nav>
            </header>

            <main className="communaute-main">

                <div className="communaute-layout">

                    {/* COLONNE GAUCHE — FEED */}
                    <div className="communaute-feed">

                        <div className="feed-header">
                            <h2 className="communaute-section-title">Feed</h2>
                            <button
                                className={`main-button ${showPostForm ? "active" : ""}`}
                                onClick={() => setShowPostForm(!showPostForm)}
                            >
                                ✍️ Poster
                            </button>
                        </div>

                        {/* FORM POST */}
                        {showPostForm && (
                            <div className="post-form">
                                <select
                                    className="flow-select"
                                    value={postType}
                                    onChange={e => setPostType(e.target.value)}
                                >
                                    <option value="free">💬 Message libre</option>
                                    <option value="task_completed">✅ Tâche complétée</option>
                                    <option value="objective_reached">🎯 Objectif atteint</option>
                                </select>
                                <textarea
                                    className="post-textarea"
                                    placeholder="Partage quelque chose avec la communauté..."
                                    value={newPost}
                                    onChange={e => setNewPost(e.target.value)}
                                />
                                <button className="main-button" onClick={handleCreatePost}>
                                    Publier
                                </button>
                            </div>
                        )}

                        {/* POSTS */}
                        {posts.length === 0 && (
                            <p className="communaute-empty">Aucun post encore — sois le premier !</p>
                        )}

                        {posts.map(post => (
                            <div key={post.id} className="post-card">

                                <div className="post-header">
                                    <div className="post-user">
                                        <img
                                            src={post.avatar_url ?? "https://i.pravatar.cc/40"}
                                            alt="avatar"
                                            className="post-avatar"
                                        />
                                        <div>
                                            <span className="post-username">{post.username ?? "Anonyme"}</span>
                                            <span className="post-division">{getDivisionFromXp(post.xp)}</span>
                                        </div>
                                    </div>
                                    <div className="post-meta">
                                        <span className="post-date">{formatDate(post.created_at)}</span>
                                        <button className="post-delete" onClick={() => handleDeletePost(post.id)}>🗑</button>
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
                                        onClick={() => handleLike(post.id)}
                                    >
                                        ❤️ {post.likes_count}
                                    </button>
                                    <button
                                        className={`post-action-btn ${openCommentsPostId === post.id ? "active" : ""}`}
                                        onClick={() => handleOpenComments(post.id)}
                                    >
                                        💬 {post.comments_count}
                                    </button>
                                </div>

                                {/* COMMENTS */}
                                {openCommentsPostId === post.id && (
                                    <div className="comments-section">
                                        {(comments[post.id] ?? []).map(c => (
                                            <div key={c.id} className="comment">
                                                <img
                                                    src={c.avatar_url ?? "https://i.pravatar.cc/30"}
                                                    alt="avatar"
                                                    className="comment-avatar"
                                                />
                                                <div className="comment-body">
                                                    <span className="comment-username">{c.username}</span>
                                                    <p className="comment-content">{c.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="comment-form">
                                            <input
                                                className="comment-input"
                                                placeholder="Ajouter un commentaire..."
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && handleCreateComment(post.id)}
                                            />
                                            <button className="comment-send" onClick={() => handleCreateComment(post.id)}>
                                                ➤
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}

                    </div>

                    {/* COLONNE DROITE — LEADERBOARD */}
                    <div className="communaute-sidebar">

                        <h2 className="communaute-section-title">🏆 Leaderboard</h2>
                        <p className="leaderboard-subtitle">Top 10 cette semaine</p>

                        {leaderboard.map((user, index) => (
                            <div key={user.id} className={`leaderboard-row ${index < 3 ? "top3" : ""}`}>
                                <span className="leaderboard-rank">
                                    {index < 3 ? CROWNS[index] : `#${index + 1}`}
                                </span>
                                <img
                                    src={user.avatar_url ?? "https://i.pravatar.cc/32"}
                                    alt="avatar"
                                    className="leaderboard-avatar"
                                />
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

            </main>

        </div>
    )
}