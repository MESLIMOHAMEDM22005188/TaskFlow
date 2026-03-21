import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/parametres.css"
import { changePassword } from "../services/taskService"

// ── Helpers thème ────────────────────────────────────────────
const BG_PRESETS: Record<string, { bg: string; card: string; surface: string }> = {
    dark:       { bg: "#0f172a", card: "rgba(255,255,255,0.03)", surface: "rgba(255,255,255,0.06)" },
    darker:     { bg: "#0a0a0f", card: "rgba(255,255,255,0.03)", surface: "rgba(255,255,255,0.05)" },
    midnight:   { bg: "#020618", card: "rgba(255,255,255,0.04)", surface: "rgba(255,255,255,0.07)" },
    slate:      { bg: "#1e293b", card: "rgba(255,255,255,0.05)", surface: "rgba(255,255,255,0.08)" },
    charcoal:   { bg: "#111827", card: "rgba(255,255,255,0.04)", surface: "rgba(255,255,255,0.07)" },
    warm:       { bg: "#1a1412", card: "rgba(255,255,255,0.04)", surface: "rgba(255,255,255,0.07)" },
}

function applyTheme(color: string, dark: boolean, bgKey: string) {
    const root = document.documentElement
    root.style.setProperty("--accent", color)
    root.style.setProperty("--accent-rgb", hexToRgb(color))
    const preset = BG_PRESETS[bgKey] ?? BG_PRESETS.dark
    root.style.setProperty("--bg", dark ? preset.bg : "#f4f4f7")
    root.style.setProperty("--bg-card", dark ? preset.card : "rgba(0,0,0,0.03)")
    root.style.setProperty("--bg-surface", dark ? preset.surface : "rgba(0,0,0,0.05)")
    root.classList.toggle("light-mode", !dark)
    localStorage.setItem("accent_color", color)
    localStorage.setItem("dark_mode", String(dark))
    localStorage.setItem("bg_preset", bgKey)
}

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
}

// ── Types ────────────────────────────────────────────────────
type NotifSettings = {
    habits: boolean
    milestones: boolean
    community_likes: boolean
    community_comments: boolean
    flow_reminders: boolean
    weekly_recap: boolean
    relapse_support: boolean
}

type PrivacySettings = {
    profile_public: boolean
    show_xp: boolean
    show_streaks: boolean
    default_posts_private: boolean
    default_habits_private: boolean
    appear_in_leaderboard: boolean
}

// ── Toggle ───────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <label className="switch">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="slider" />
        </label>
    )
}

// ── SettingRow ───────────────────────────────────────────────
function SettingRow({
                        icon, title, desc, children
                    }: {
    icon: string
    title: string
    desc?: string
    children: React.ReactNode
}) {
    return (
        <div className="setting-row">
            <div className="setting-row-left">
                <span className="setting-row-icon">{icon}</span>
                <div>
                    <h3 className="setting-row-title">{title}</h3>
                    {desc && <p className="setting-row-desc">{desc}</p>}
                </div>
            </div>
            <div className="setting-row-right">{children}</div>
        </div>
    )
}

// ── Section ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="settings-card">
            <h2 className="settings-section-title">{title}</h2>
            {children}
        </section>
    )
}

// ── Composant principal ──────────────────────────────────────
export default function Parametres() {
    const navigate = useNavigate()

    // Apparence
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("dark_mode") !== "false")
    const [accentColor, setAccentColor] = useState(() => localStorage.getItem("accent_color") ?? "#6366f1")
    const [bgPreset, setBgPreset] = useState(() => localStorage.getItem("bg_preset") ?? "dark")
    const [language, setLanguage] = useState("fr")
    const [compactMode, setCompactMode] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)

    // Notifications
    const [notifs, setNotifs] = useState<NotifSettings>({
        habits: true,
        milestones: true,
        community_likes: true,
        community_comments: true,
        flow_reminders: false,
        weekly_recap: true,
        relapse_support: true,
    })

    // Confidentialité
    const [privacy, setPrivacy] = useState<PrivacySettings>({
        profile_public: true,
        show_xp: true,
        show_streaks: true,
        default_posts_private: false,
        default_habits_private: false,
        appear_in_leaderboard: true,
    })

    // Mot de passe
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [showCurrentPw, setShowCurrentPw] = useState(false)
    const [showNewPw, setShowNewPw] = useState(false)

    // RGPD
    const [exportLoading, setExportLoading] = useState(false)
    const [exportDone, setExportDone] = useState(false)
    const [showDataSummary, setShowDataSummary] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [showDangerZone, setShowDangerZone] = useState(false)

    // Appliquer le thème à chaque changement
    useEffect(() => {
        applyTheme(accentColor, darkMode, bgPreset)
    }, [accentColor, darkMode, bgPreset])

    function toggleNotif(key: keyof NotifSettings) {
        setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
    }

    function togglePrivacy(key: keyof PrivacySettings) {
        setPrivacy(prev => ({ ...prev, [key]: !prev[key] }))
    }

    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    function handleLogoutAllDevices() {
        if (!confirm("Se déconnecter de tous les appareils ?")) return
        localStorage.removeItem("token")
        navigate("/login")
    }

    async function handleChangePassword() {
        setPasswordError("")
        if (newPassword !== confirmPassword) {
            setPasswordError("Les mots de passe ne correspondent pas")
            return
        }
        if (newPassword.length < 8) {
            setPasswordError("Le mot de passe doit faire au moins 8 caractères")
            return
        }
        if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setPasswordError("Le mot de passe doit contenir au moins une majuscule et un chiffre")
            return
        }
        try {
            await changePassword(currentPassword, newPassword)
            setPasswordSuccess(true)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setTimeout(() => {
                setPasswordSuccess(false)
                setShowPasswordForm(false)
            }, 2500)
        } catch {
            setPasswordError("Mot de passe actuel incorrect")
        }
    }

    async function handleExportData() {
        setExportLoading(true)
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/account/export`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `taskflow-mes-donnees-${new Date().toISOString().split("T")[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
            setExportDone(true)
            setTimeout(() => setExportDone(false), 4000)
        } catch {
            alert("Erreur lors de l'export. Réessaie plus tard.")
        } finally {
            setExportLoading(false)
        }
    }

    async function handleDeleteAccount() {
        if (deleteConfirmText !== "SUPPRIMER") return
        try {
            const token = localStorage.getItem("token")
            await fetch(`${import.meta.env.VITE_API_URL}/api/account/delete`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            localStorage.removeItem("token")
            navigate("/login")
        } catch {
            alert("Erreur lors de la suppression. Contacte le support.")
        }
    }

    const ACCENT_COLORS = ["#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"]
    const allNotifsOff = Object.values(notifs).every(v => !v)

    return (
        <div className="settings-page">

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

            <main className="settings-main">

                <div className="settings-hero">
                    <h1 className="settings-title">Paramètres</h1>
                    <p className="settings-subtitle">Personnalise ton expérience TaskFlow</p>
                </div>

                {/* ── APPARENCE ── */}
                <Section title="🎨 Apparence">
                    <SettingRow icon="🌙" title="Mode sombre" desc="Thème sombre pour réduire la fatigue oculaire">
                        <Toggle checked={darkMode} onChange={() => setDarkMode(d => !d)} />
                    </SettingRow>

                    <SettingRow icon="⚡" title="Mode compact" desc="Réduit l'espacement pour afficher plus de contenu">
                        <Toggle checked={compactMode} onChange={() => setCompactMode(v => !v)} />
                    </SettingRow>

                    <SettingRow icon="✨" title="Réduire les animations" desc="Pour les personnes sensibles aux mouvements">
                        <Toggle checked={reducedMotion} onChange={() => setReducedMotion(v => !v)} />
                    </SettingRow>

                    <SettingRow icon="🎨" title="Couleur d'accent" desc="Couleur principale de l'interface — appliquée immédiatement">
                        <div className="color-picker">
                            {ACCENT_COLORS.map(c => (
                                <div
                                    key={c}
                                    className={`color-dot ${accentColor === c ? "selected" : ""}`}
                                    style={{ background: c }}
                                    onClick={() => setAccentColor(c)}
                                />
                            ))}
                        </div>
                    </SettingRow>

                    <SettingRow icon="🌌" title="Fond de l'interface" desc="Teinte de fond — appliquée immédiatement">
                        <div className="bg-picker">
                            {Object.entries({ dark: "#0f172a", darker: "#0a0a0f", midnight: "#020618", slate: "#1e293b", charcoal: "#111827", warm: "#1a1412" }).map(([key, hex]) => (
                                <div
                                    key={key}
                                    className={`bg-dot ${bgPreset === key ? "selected" : ""}`}
                                    style={{ background: hex }}
                                    title={key}
                                    onClick={() => setBgPreset(key)}
                                />
                            ))}
                        </div>
                    </SettingRow>

                    <SettingRow icon="🌍" title="Langue" desc="Langue de l'interface">
                        <select
                            className="settings-select"
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                        >
                            <option value="fr">🇫🇷 Français</option>
                            <option value="en">🇬🇧 English</option>
                            <option value="es">🇪🇸 Español</option>
                            <option value="de">🇩🇪 Deutsch</option>
                        </select>
                    </SettingRow>
                </Section>

                {/* ── COMPTE ── */}
                <Section title="👤 Compte">
                    <SettingRow icon="✏️" title="Modifier le profil" desc="Nom d'utilisateur, bio, avatar">
                        <button className="settings-btn-outline" onClick={() => navigate("/profil")}>
                            Modifier →
                        </button>
                    </SettingRow>

                    <SettingRow icon="🔑" title="Changer le mot de passe" desc="Sécurise ton compte">
                        <button
                            className="settings-btn-outline"
                            onClick={() => setShowPasswordForm(v => !v)}
                        >
                            {showPasswordForm ? "Annuler" : "Modifier"}
                        </button>
                    </SettingRow>

                    {showPasswordForm && (
                        <div className="settings-subform">
                            <div className="pw-input-wrapper">
                                <input
                                    className="settings-input"
                                    type={showCurrentPw ? "text" : "password"}
                                    placeholder="Mot de passe actuel"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                />
                                <button className="pw-toggle" onClick={() => setShowCurrentPw(v => !v)}>
                                    {showCurrentPw ? "🙈" : "👁"}
                                </button>
                            </div>
                            <div className="pw-input-wrapper">
                                <input
                                    className="settings-input"
                                    type={showNewPw ? "text" : "password"}
                                    placeholder="Nouveau mot de passe (8+ car., 1 maj., 1 chiffre)"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                                <button className="pw-toggle" onClick={() => setShowNewPw(v => !v)}>
                                    {showNewPw ? "🙈" : "👁"}
                                </button>
                            </div>
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="Confirmer le nouveau mot de passe"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                            {newPassword.length > 0 && (
                                <div className="pw-strength">
                                    <div className="pw-strength-bar">
                                        <div
                                            className="pw-strength-fill"
                                            style={{
                                                width: `${Math.min(100, newPassword.length * 8)}%`,
                                                background: newPassword.length < 8 ? "#ef4444"
                                                    : newPassword.length < 12 ? "#f59e0b" : "#22c55e"
                                            }}
                                        />
                                    </div>
                                    <span className="pw-strength-label">
                                        {newPassword.length < 8 ? "Faible" : newPassword.length < 12 ? "Moyen" : "Fort"}
                                    </span>
                                </div>
                            )}
                            {passwordError && <p className="form-error">⚠️ {passwordError}</p>}
                            {passwordSuccess && <p className="form-success">✅ Mot de passe mis à jour !</p>}
                            <button className="main-button" onClick={handleChangePassword}>
                                Confirmer le changement
                            </button>
                        </div>
                    )}
                </Section>

                {/* ── NOTIFICATIONS ── */}
                <Section title="🔔 Notifications">
                    <p className="settings-section-desc">
                        Choisis exactement ce que tu veux recevoir.
                    </p>
                    <SettingRow icon="🏃" title="Rappels d'habitudes" desc="Quand une habitude n'a pas été faite aujourd'hui">
                        <Toggle checked={notifs.habits} onChange={() => toggleNotif("habits")} />
                    </SettingRow>
                    <SettingRow icon="🏆" title="Milestones atteints" desc="7, 30, 90, 180, 365 jours de streak">
                        <Toggle checked={notifs.milestones} onChange={() => toggleNotif("milestones")} />
                    </SettingRow>
                    <SettingRow icon="💙" title="Soutien rechute" desc="Message de soutien après une rechute enregistrée">
                        <Toggle checked={notifs.relapse_support} onChange={() => toggleNotif("relapse_support")} />
                    </SettingRow>
                    <SettingRow icon="❤️" title="Likes sur mes posts" desc="Quand quelqu'un like un de tes posts">
                        <Toggle checked={notifs.community_likes} onChange={() => toggleNotif("community_likes")} />
                    </SettingRow>
                    <SettingRow icon="💬" title="Commentaires" desc="Quand quelqu'un commente tes posts">
                        <Toggle checked={notifs.community_comments} onChange={() => toggleNotif("community_comments")} />
                    </SettingRow>
                    <SettingRow icon="⏱" title="Rappels Flow" desc="Te rappeler de faire une session focus">
                        <Toggle checked={notifs.flow_reminders} onChange={() => toggleNotif("flow_reminders")} />
                    </SettingRow>
                    <SettingRow icon="📊" title="Récap hebdomadaire" desc="Résumé de ta semaine chaque dimanche">
                        <Toggle checked={notifs.weekly_recap} onChange={() => toggleNotif("weekly_recap")} />
                    </SettingRow>
                    <button className="settings-btn-ghost" onClick={() => {
                        setNotifs(allNotifsOff ? {
                            habits: true, milestones: true, community_likes: true,
                            community_comments: true, flow_reminders: false,
                            weekly_recap: true, relapse_support: true
                        } : {
                            habits: false, milestones: false, community_likes: false,
                            community_comments: false, flow_reminders: false,
                            weekly_recap: false, relapse_support: false
                        })
                    }}>
                        {allNotifsOff ? "✅ Tout activer" : "🔕 Tout désactiver"}
                    </button>
                </Section>

                {/* ── CONFIDENTIALITÉ ── */}
                <Section title="🔒 Confidentialité">
                    <p className="settings-section-desc">
                        Ces paramètres contrôlent ce que les autres utilisateurs peuvent voir de toi.
                    </p>
                    <SettingRow icon="👤" title="Profil public" desc="Les autres utilisateurs peuvent voir ton profil">
                        <Toggle checked={privacy.profile_public} onChange={() => togglePrivacy("profile_public")} />
                    </SettingRow>
                    <SettingRow icon="⚡" title="Afficher mon XP" desc="Visible sur ton profil et le leaderboard">
                        <Toggle checked={privacy.show_xp} onChange={() => togglePrivacy("show_xp")} />
                    </SettingRow>
                    <SettingRow icon="🔥" title="Afficher mes streaks" desc="Visible sur ton profil public">
                        <Toggle checked={privacy.show_streaks} onChange={() => togglePrivacy("show_streaks")} />
                    </SettingRow>
                    <SettingRow icon="🏆" title="Apparaître dans le leaderboard" desc="Ton nom et XP visibles dans les classements">
                        <Toggle checked={privacy.appear_in_leaderboard} onChange={() => togglePrivacy("appear_in_leaderboard")} />
                    </SettingRow>
                    <SettingRow icon="📝" title="Posts privés par défaut" desc="Nouveaux posts en mode privé par défaut">
                        <Toggle checked={privacy.default_posts_private} onChange={() => togglePrivacy("default_posts_private")} />
                    </SettingRow>
                    <SettingRow icon="🏃" title="Habitudes privées par défaut" desc="Nouvelles habitudes en mode privé par défaut">
                        <Toggle checked={privacy.default_habits_private} onChange={() => togglePrivacy("default_habits_private")} />
                    </SettingRow>
                </Section>

                {/* ── SÉCURITÉ ── */}
                <Section title="🛡 Sécurité">
                    <SettingRow icon="📱" title="Cet appareil" desc="Connecté · Session active">
                        <span className="session-badge active">Actif</span>
                    </SettingRow>
                    <SettingRow icon="🚪" title="Déconnecter tous les appareils" desc="Met fin à toutes les sessions actives">
                        <button className="settings-btn-outline danger" onClick={handleLogoutAllDevices}>
                            Déconnecter tout
                        </button>
                    </SettingRow>
                    <SettingRow icon="🔐" title="Authentification à deux facteurs" desc="Ajoute une couche de sécurité supplémentaire">
                        <span className="settings-badge-soon">Bientôt</span>
                    </SettingRow>
                </Section>

                {/* ── MES DONNÉES (RGPD) ── */}
                <Section title="📦 Mes données — RGPD">
                    <div className="rgpd-intro">
                        <p>
                            Conformément au <strong>Règlement Général sur la Protection des Données (RGPD)</strong>,
                            tu as le droit d'accéder à tes données, de les télécharger et de les faire supprimer.
                            TaskFlow ne revend jamais tes données à des tiers.
                        </p>
                    </div>

                    <SettingRow icon="📥" title="Exporter mes données" desc="Télécharge toutes tes données en JSON (tâches, habitudes, stats, posts...)">
                        <button
                            className={`settings-btn-outline ${exportDone ? "success" : ""}`}
                            onClick={handleExportData}
                            disabled={exportLoading}
                        >
                            {exportLoading ? "⏳ Export..." : exportDone ? "✅ Téléchargé !" : "⬇ Exporter"}
                        </button>
                    </SettingRow>

                    <SettingRow icon="🔍" title="Voir ce que nous stockons" desc="Liste des données associées à ton compte">
                        <button className="settings-btn-outline" onClick={() => setShowDataSummary(v => !v)}>
                            {showDataSummary ? "Masquer" : "Voir"}
                        </button>
                    </SettingRow>

                    {showDataSummary && (
                        <div className="data-summary">
                            <p className="data-summary-title">📋 Données stockées sur ton compte :</p>
                            <ul className="data-summary-list">
                                <li>✅ <strong>Compte</strong> — email, nom d'utilisateur, mot de passe (hashé bcrypt), bio, avatar</li>
                                <li>✅ <strong>Tâches</strong> — toutes tes tâches, historique de complétion, thèmes</li>
                                <li>✅ <strong>Habitudes</strong> — habitudes, logs quotidiens, milestones, streaks</li>
                                <li>✅ <strong>Objectifs</strong> — objectifs créés et progression</li>
                                <li>✅ <strong>Flow</strong> — sessions de focus, paramètres timer</li>
                                <li>✅ <strong>Communauté</strong> — posts, commentaires, likes, groupes rejoints</li>
                                <li>✅ <strong>Stats</strong> — XP, activité quotidienne, heatmap</li>
                                <li>🔒 <strong>Posts anonymes</strong> — stockés sans lien visible avec ton identité</li>
                                <li>❌ <strong>Non collecté</strong> — données de navigation, cookies tiers, publicité</li>
                            </ul>
                            <p className="data-summary-contact">
                                Pour toute question : <strong>privacy@taskflow.app</strong> — Réponse sous 30 jours (délai légal RGPD).
                            </p>
                        </div>
                    )}

                    <SettingRow icon="📤" title="Droit à la portabilité" desc="Tes données exportées sont dans un format standard JSON">
                        <span className="settings-badge-ok">✓ Conforme</span>
                    </SettingRow>

                    <SettingRow icon="✏️" title="Droit de rectification" desc="Tu peux modifier toutes tes données depuis ton profil">
                        <button className="settings-btn-outline" onClick={() => navigate("/profil")}>
                            Modifier →
                        </button>
                    </SettingRow>
                </Section>

                {/* ── SESSION ── */}
                <Section title="🚪 Session">
                    <SettingRow icon="🚶" title="Se déconnecter" desc="Ferme ta session sur cet appareil">
                        <button className="settings-btn-outline" onClick={handleLogout}>
                            Déconnexion
                        </button>
                    </SettingRow>
                </Section>

                {/* ── ZONE DANGER ── */}
                <div className="danger-zone-wrapper">
                    <button className="danger-zone-toggle" onClick={() => setShowDangerZone(v => !v)}>
                        ⚠️ Zone dangereuse {showDangerZone ? "▲" : "▼"}
                    </button>

                    {showDangerZone && (
                        <section className="settings-card danger-card">
                            <h2 className="settings-section-title danger-title">⚠️ Zone dangereuse</h2>

                            <SettingRow
                                icon="🗑"
                                title="Supprimer mon compte"
                                desc="Suppression définitive et irréversible de toutes tes données (RGPD — droit à l'oubli)"
                            >
                                <button
                                    className="settings-btn-outline danger"
                                    onClick={() => setShowDeleteConfirm(v => !v)}
                                >
                                    Supprimer
                                </button>
                            </SettingRow>

                            {showDeleteConfirm && (
                                <div className="delete-confirm">
                                    <div className="delete-confirm-warning">
                                        <p>⚠️ <strong>Cette action est irréversible.</strong></p>
                                        <p>Seront supprimés définitivement :</p>
                                        <ul>
                                            <li>Ton compte et toutes tes informations personnelles</li>
                                            <li>Toutes tes tâches, habitudes, objectifs et statistiques</li>
                                            <li>Tous tes posts et commentaires dans la communauté</li>
                                            <li>Ton XP, tes streaks et milestones</li>
                                        </ul>
                                        <p className="delete-confirm-delay">
                                            Conformément au RGPD, la suppression sera effective sous <strong>30 jours</strong>.
                                        </p>
                                    </div>
                                    <p className="delete-confirm-instruction">
                                        Tape <strong>SUPPRIMER</strong> pour confirmer :
                                    </p>
                                    <input
                                        className="settings-input"
                                        placeholder="SUPPRIMER"
                                        value={deleteConfirmText}
                                        onChange={e => setDeleteConfirmText(e.target.value)}
                                    />
                                    <button
                                        className="main-button danger-btn"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteConfirmText !== "SUPPRIMER"}
                                    >
                                        🗑 Confirmer la suppression définitive
                                    </button>
                                    <button
                                        className="settings-btn-ghost"
                                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText("") }}
                                    >
                                        Annuler — garder mon compte
                                    </button>
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <div className="settings-footer">
                    <p>TaskFlow respecte ta vie privée. Aucune publicité, aucune revente de données.</p>
                    <div className="settings-footer-links">
                        <a href="/politique-confidentialite" className="settings-footer-link">Politique de confidentialité</a>
                        <span>·</span>
                        <a href="/cgu" className="settings-footer-link">CGU</a>
                        <span>·</span>
                        <a href="mailto:privacy@taskflow.app" className="settings-footer-link">Contact DPO</a>
                    </div>
                </div>

            </main>
        </div>
    )
}