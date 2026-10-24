import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/parametres.css"
import { changePassword, getPreferences, savePreferences } from "../services/taskService"
import { API_ROOT } from "../services/api"
import Navbar from "../components/Navbar"
import { applyLanguage, LANGUAGES, t, type GrindlyLanguage } from "../i18n"

// ── Helpers thème ────────────────────────────────────────────
const BG_PRESETS: Record<string, { bg: string; card: string; surface: string; label: string }> = {
    obsidian: { bg: "#0a0a0f", card: "rgba(255,255,255,0.035)", surface: "rgba(255,255,255,0.06)", label: "Obsidienne" },
    navy: { bg: "#0f172a", card: "rgba(255,255,255,0.03)", surface: "rgba(255,255,255,0.06)", label: "Marine" },
    charcoal: { bg: "#18181b", card: "rgba(255,255,255,0.04)", surface: "rgba(255,255,255,0.07)", label: "Charbon" },
    midnight: { bg: "#050d1a", card: "rgba(99,120,255,0.06)", surface: "rgba(99,120,255,0.1)", label: "Minuit" },
    abyss: { bg: "#03111a", card: "rgba(0,150,200,0.06)", surface: "rgba(0,150,200,0.1)", label: "Abysses" },
    forest: { bg: "#071510", card: "rgba(34,197,94,0.05)", surface: "rgba(34,197,94,0.09)", label: "Forêt" },
    ember: { bg: "#180d08", card: "rgba(239,100,68,0.06)", surface: "rgba(239,100,68,0.1)", label: "Braise" },
    wine: { bg: "#150812", card: "rgba(200,50,100,0.06)", surface: "rgba(200,50,100,0.1)", label: "Bordeaux" },
    dusk: { bg: "#130d1f", card: "rgba(168,85,247,0.06)", surface: "rgba(168,85,247,0.1)", label: "Crépuscule" },
    slate: { bg: "#111827", card: "rgba(148,163,184,0.06)", surface: "rgba(148,163,184,0.11)", label: "Ardoise" },
    graphite: { bg: "#20252e", card: "rgba(203,213,225,0.05)", surface: "rgba(203,213,225,0.09)", label: "Graphite" },
    ocean: { bg: "#062b3a", card: "rgba(34,211,238,0.06)", surface: "rgba(34,211,238,0.11)", label: "Océan" },
    arctic: { bg: "#0b2233", card: "rgba(125,211,252,0.07)", surface: "rgba(125,211,252,0.12)", label: "Arctique" },
    indigo: { bg: "#16123a", card: "rgba(129,140,248,0.07)", surface: "rgba(129,140,248,0.13)", label: "Indigo" },
    lavender: { bg: "#211a35", card: "rgba(196,181,253,0.06)", surface: "rgba(196,181,253,0.11)", label: "Lavande" },
    plum: { bg: "#2a102b", card: "rgba(232,121,249,0.06)", surface: "rgba(232,121,249,0.11)", label: "Prune" },
    rose: { bg: "#30131f", card: "rgba(251,113,133,0.06)", surface: "rgba(251,113,133,0.11)", label: "Rose" },
    cocoa: { bg: "#2a1d18", card: "rgba(214,175,145,0.06)", surface: "rgba(214,175,145,0.11)", label: "Cacao" },
    copper: { bg: "#2b1a13", card: "rgba(251,146,60,0.06)", surface: "rgba(251,146,60,0.11)", label: "Cuivre" },
    emerald: { bg: "#06251d", card: "rgba(52,211,153,0.06)", surface: "rgba(52,211,153,0.11)", label: "Émeraude" },
    moss: { bg: "#172315", card: "rgba(163,190,110,0.06)", surface: "rgba(163,190,110,0.11)", label: "Mousse" },
    cobalt: { bg: "#0b1f4d", card: "rgba(96,165,250,0.07)", surface: "rgba(96,165,250,0.12)", label: "Cobalt" },
    twilight: { bg: "#211747", card: "rgba(167,139,250,0.07)", surface: "rgba(167,139,250,0.12)", label: "Aurore" },
    cherry: { bg: "#350d18", card: "rgba(251,113,133,0.06)", surface: "rgba(251,113,133,0.12)", label: "Cerise" },
    sand: { bg: "#2b251b", card: "rgba(217,187,133,0.06)", surface: "rgba(217,187,133,0.11)", label: "Sable" },
    petrol: { bg: "#062e2e", card: "rgba(45,212,191,0.06)", surface: "rgba(45,212,191,0.11)", label: "Pétrole" },
    smoke: { bg: "#24272e", card: "rgba(161,161,170,0.06)", surface: "rgba(161,161,170,0.11)", label: "Fumée" },
    garnet: { bg: "#2c1114", card: "rgba(248,113,113,0.06)", surface: "rgba(248,113,113,0.11)", label: "Grenat" },
}

const LIGHT_BG_PRESETS: Record<string, { bg: string; card: string; surface: string; label: string }> = {
    pearl: { bg: "#f5f7fb", card: "rgba(255,255,255,0.92)", surface: "rgba(255,255,255,0.98)", label: "Perle" },
    snow: { bg: "#ffffff", card: "rgba(248,250,252,0.98)", surface: "rgba(241,245,249,0.96)", label: "Neige" },
    mist: { bg: "#edf2f7", card: "rgba(255,255,255,0.9)", surface: "rgba(226,232,240,0.72)", label: "Brume" },
    sand: { bg: "#f6f0e5", card: "rgba(255,255,255,0.82)", surface: "rgba(235,224,204,0.72)", label: "Sable" },
    lavender: { bg: "#f2efff", card: "rgba(255,255,255,0.86)", surface: "rgba(221,214,254,0.6)", label: "Lavande" },
    rose: { bg: "#fff0f3", card: "rgba(255,255,255,0.88)", surface: "rgba(251,207,232,0.5)", label: "Rose poudré" },
    sage: { bg: "#edf5ef", card: "rgba(255,255,255,0.88)", surface: "rgba(187,222,195,0.48)", label: "Sauge" },
    sky: { bg: "#eaf5ff", card: "rgba(255,255,255,0.9)", surface: "rgba(186,230,253,0.55)", label: "Ciel" },
    peach: { bg: "#fff1e8", card: "rgba(255,255,255,0.9)", surface: "rgba(254,215,170,0.52)", label: "Pêche" },
    mint: { bg: "#e8faf5", card: "rgba(255,255,255,0.9)", surface: "rgba(153,246,228,0.42)", label: "Menthe" },
    butter: { bg: "#fff9df", card: "rgba(255,255,255,0.9)", surface: "rgba(254,240,138,0.4)", label: "Vanille" },
    stone: { bg: "#f0efed", card: "rgba(255,255,255,0.9)", surface: "rgba(214,211,209,0.5)", label: "Pierre" },
};

function applyTheme(color: string, dark: boolean, bgKey: string) {
    const root = document.documentElement
    root.style.setProperty("--accent", color)
    root.style.setProperty("--accent-rgb", hexToRgb(color))
    const preset = (dark ? BG_PRESETS[bgKey] : LIGHT_BG_PRESETS[bgKey]) ?? (dark ? BG_PRESETS.navy : LIGHT_BG_PRESETS.pearl)
    root.style.setProperty("--bg",         preset.bg)
    root.style.setProperty("--bg-card",    preset.card)
    root.style.setProperty("--bg-surface", preset.surface)
    const savedTopbar = localStorage.getItem("grindly-topbar-color")
    if (savedTopbar && /^#[0-9a-f]{6}$/i.test(savedTopbar)) root.style.setProperty("--topbar-custom-bg", savedTopbar)
    root.classList.toggle("light-mode", !dark)
    localStorage.setItem("grindly-theme", dark ? "dark" : "light")
    localStorage.setItem(dark ? "grindly-bg-dark" : "grindly-bg-light", bgKey)
    localStorage.setItem("grindly-bg-preset", bgKey)
    window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: !dark } }))
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
                        icon, title, desc, children, wide = false
                    }: {
    icon: string
    title: string
    desc?: string
    children: React.ReactNode
    wide?: boolean
}) {
    return (
        <div className={`setting-row ${wide ? "setting-row-wide" : ""}`}>
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

    // Apparence — valeurs par défaut, écrasées dès le chargement API
    const [loaded, setLoaded] = useState(false)
    const [darkMode, setDarkMode] = useState(true)
    const [accentColor, setAccentColor] = useState("#6366f1")
    const [darkBgPreset, setDarkBgPreset] = useState(() => localStorage.getItem("grindly-bg-dark") || localStorage.getItem("grindly-bg-preset") || "navy")
    const [lightBgPreset, setLightBgPreset] = useState(() => localStorage.getItem("grindly-bg-light") || "pearl")
    const [darkTopbarColor, setDarkTopbarColor] = useState(() => localStorage.getItem("grindly-topbar-dark") || localStorage.getItem("grindly-topbar-color") || "#10111a")
    const [lightTopbarColor, setLightTopbarColor] = useState(() => localStorage.getItem("grindly-topbar-light") || "#ffffff")
    const topbarColor = darkMode ? darkTopbarColor : lightTopbarColor
    const [language, setLanguage] = useState("fr")
    const [compactMode, setCompactMode] = useState(false)
    const [reducedMotion, setReducedMotion] = useState(false)

    // Notifications
    const [notifs, setNotifs] = useState<NotifSettings>({
        habits: true, milestones: true, community_likes: true,
        community_comments: true, flow_reminders: false,
        weekly_recap: true, relapse_support: true,
    })

    // Confidentialité
    const [privacy, setPrivacy] = useState<PrivacySettings>({
        profile_public: true, show_xp: true, show_streaks: true,
        default_posts_private: false, default_habits_private: false,
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
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

    // Debounce ref
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        const syncTheme = (event: Event) => {
            const detail = (event as CustomEvent<{ lightMode?: boolean }>).detail
            if (typeof detail?.lightMode === "boolean") setDarkMode(!detail.lightMode)
        }
        window.addEventListener("grindly-theme-change", syncTheme)
        return () => window.removeEventListener("grindly-theme-change", syncTheme)
    }, [])

    // ── Chargement initial depuis l'API ──────────────────────
    useEffect(() => {
        getPreferences().then(prefs => {
            const savedTheme = localStorage.getItem("grindly-theme")
            setDarkMode(savedTheme ? savedTheme === "dark" : !!prefs.dark_mode)
            setAccentColor(prefs.accent_color)
            const legacyPresets: Record<string, string> = { dark: "navy", darker: "obsidian", warm: "cocoa" }
            const savedPreset = localStorage.getItem("grindly-bg-preset") || prefs.bg_preset || "navy"
            setDarkBgPreset(BG_PRESETS[savedPreset] ? savedPreset : (legacyPresets[savedPreset] || "navy"))
            const savedLightPreset = localStorage.getItem("grindly-bg-light") || "pearl"
            setLightBgPreset(LIGHT_BG_PRESETS[savedLightPreset] ? savedLightPreset : "pearl")
            const storedLanguage = (localStorage.getItem("grindly-language") || prefs.language || "fr") as GrindlyLanguage
            setLanguage(storedLanguage)
            applyLanguage(storedLanguage)
            const storedTopbar = localStorage.getItem("grindly-topbar-color")
            const storedDarkTopbar = localStorage.getItem("grindly-topbar-dark") || storedTopbar
            const storedLightTopbar = localStorage.getItem("grindly-topbar-light") || "#ffffff"
            if (storedDarkTopbar && /^#[0-9a-f]{6}$/i.test(storedDarkTopbar)) setDarkTopbarColor(storedDarkTopbar)
            if (storedLightTopbar && /^#[0-9a-f]{6}$/i.test(storedLightTopbar)) setLightTopbarColor(storedLightTopbar)
            setCompactMode(!!prefs.compact_mode)
            setReducedMotion(!!prefs.reduced_motion)
            setNotifs({
                habits: !!prefs.notif_habits,
                milestones: !!prefs.notif_milestones,
                community_likes: !!prefs.notif_community_likes,
                community_comments: !!prefs.notif_community_comments,
                flow_reminders: !!prefs.notif_flow_reminders,
                weekly_recap: !!prefs.notif_weekly_recap,
                relapse_support: !!prefs.notif_relapse_support,
            })
            setPrivacy({
                profile_public: !!prefs.privacy_profile_public,
                show_xp: !!prefs.privacy_show_xp,
                show_streaks: !!prefs.privacy_show_streaks,
                appear_in_leaderboard: !!prefs.privacy_appear_leaderboard,
                default_posts_private: !!prefs.privacy_default_posts_private,
                default_habits_private: !!prefs.privacy_default_habits_private,
            })
            setLoaded(true)
        }).catch(() => setLoaded(true))
    }, [])

    // ── Appliquer le thème visuellement ─────────────────────
    useEffect(() => {
        applyTheme(accentColor, darkMode, darkMode ? darkBgPreset : lightBgPreset)
        if (/^#[0-9a-f]{6}$/i.test(topbarColor)) {
            localStorage.setItem(darkMode ? "grindly-topbar-dark" : "grindly-topbar-light", topbarColor)
            localStorage.setItem("grindly-topbar-color", topbarColor)
            const root = document.documentElement
            root.style.setProperty("--topbar-custom-bg", topbarColor)
            // Keep text readable on both light and dark custom topbar colors.
            const hex = topbarColor.slice(1)
            const brightness = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000
            const lightText = brightness < 145
            root.style.setProperty("--topbar-text", lightText ? "#f8fafc" : "#20202b")
            root.style.setProperty("--topbar-muted", lightText ? "#c4c8d4" : "#5b6170")
            root.style.setProperty("--topbar-border", lightText ? "rgba(255,255,255,.14)" : "rgba(22,22,35,.13)")
            root.style.setProperty("--topbar-hover", lightText ? "rgba(255,255,255,.09)" : "rgba(22,22,35,.07)")
            root.style.setProperty("--topbar-active-bg", lightText ? "rgba(255,255,255,.14)" : "rgba(22,22,35,.09)")
        }
    }, [accentColor, darkMode, darkBgPreset, lightBgPreset, topbarColor])

    // ── Sauvegarde auto avec debounce 800ms ─────────────────
    useEffect(() => {
        if (!loaded) return // ne pas sauvegarder avant le chargement initial
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setSaveStatus("saving")
        saveTimer.current = setTimeout(() => {
            savePreferences({
                accent_color: accentColor,
                bg_preset: darkBgPreset,
                dark_mode: darkMode,
                compact_mode: compactMode,
                reduced_motion: reducedMotion,
                language,
                notif_habits: notifs.habits,
                notif_milestones: notifs.milestones,
                notif_community_likes: notifs.community_likes,
                notif_community_comments: notifs.community_comments,
                notif_flow_reminders: notifs.flow_reminders,
                notif_weekly_recap: notifs.weekly_recap,
                notif_relapse_support: notifs.relapse_support,
                privacy_profile_public: privacy.profile_public,
                privacy_show_xp: privacy.show_xp,
                privacy_show_streaks: privacy.show_streaks,
                privacy_appear_leaderboard: privacy.appear_in_leaderboard,
                privacy_default_posts_private: privacy.default_posts_private,
                privacy_default_habits_private: privacy.default_habits_private,
            }).then(() => setSaveStatus("saved"))
                .catch(() => setSaveStatus("idle"))
                .finally(() => setTimeout(() => setSaveStatus("idle"), 2000))
        }, 800)
    }, [
        loaded, accentColor, darkBgPreset, darkMode, compactMode, reducedMotion,
        language, notifs, privacy
    ])

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
            const res = await fetch(`${API_ROOT}/account/export`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `grindly-mes-donnees-${new Date().toISOString().split("T")[0]}.json`
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
            await fetch(`${API_ROOT}/account/delete`, {
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

            <Navbar />

            <main className="settings-main">

                <div className="settings-hero">
                    <h1 className="settings-title">Paramètres</h1>
                    <p className="settings-subtitle">
                        Personnalise ton expérience Grindly
                        {saveStatus === "saving" && <span className="save-status saving"> · Sauvegarde...</span>}
                        {saveStatus === "saved" && <span className="save-status saved"> · ✓ Sauvegardé</span>}
                    </p>
                </div>

                {/* ── APPARENCE ── */}
                <Section title={`🎨 ${t(language, "settings.appearance")}`}>
                    <SettingRow icon="🌙" title="Mode sombre" desc="Thème sombre pour réduire la fatigue oculaire">
                        <Toggle checked={darkMode} onChange={() => setDarkMode(d => !d)} />
                    </SettingRow>

                    <SettingRow icon="⚡" title="Mode compact" desc="Réduit l'espacement pour afficher plus de contenu">
                        <Toggle checked={compactMode} onChange={() => setCompactMode(v => !v)} />
                    </SettingRow>

                    <SettingRow icon="✨" title="Réduire les animations" desc="Pour les personnes sensibles aux mouvements">
                        <Toggle checked={reducedMotion} onChange={() => setReducedMotion(v => !v)} />
                    </SettingRow>

                    <SettingRow icon="🎨" title={t(language, "settings.accent")} desc={t(language, "settings.accentDesc")}>
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

                    <SettingRow icon="▰" title={t(language, "settings.topbar")} desc={t(language, "settings.topbarDesc")}>
                        <div className="topbar-theme-picker">
                            <div className="bg-mode-tabs" role="group" aria-label="Mode de couleur de la barre supérieure">
                                <button type="button" className={darkMode ? "active" : ""} onClick={() => setDarkMode(true)}>🌙 Sombre</button>
                                <button type="button" className={!darkMode ? "active" : ""} onClick={() => setDarkMode(false)}>☀️ Clair</button>
                            </div>
                            <div className="topbar-preset-grid" role="radiogroup" aria-label="Choisir une couleur de barre supérieure">
                                {(darkMode ? [
                                    ["midnight", "#10111a"], ["obsidian", "#0a0a0f"], ["navy", "#0f172a"], ["charcoal", "#27272a"],
                                    ["forest", "#10231b"], ["ocean", "#083344"], ["plum", "#2a102b"], ["wine", "#3b1025"],
                                    ["indigo", "#211b55"], ["slate", "#334155"], ["cocoa", "#3a2922"], ["black", "#000000"]
                                ] : [
                                    ["white", "#ffffff"], ["pearl", "#f5f7fb"], ["mist", "#e9eef5"], ["sand", "#f6f0e5"],
                                    ["lavender", "#f2efff"], ["rose", "#fff0f3"], ["sage", "#edf5ef"], ["sky", "#eaf5ff"],
                                    ["peach", "#fff1e8"], ["mint", "#e8faf5"], ["stone", "#e7e5e4"], ["silver", "#dfe3ea"]
                                ] as const).map(([name, color]) => (
                                    <button key={name} type="button" className={topbarColor.toLowerCase() === color ? "topbar-preset selected" : "topbar-preset"}
                                        aria-label={name} aria-pressed={topbarColor.toLowerCase() === color}
                                        title={name} onClick={() => darkMode ? setDarkTopbarColor(color) : setLightTopbarColor(color)}>
                                        <span style={{ background: color }} />
                                    </button>
                                ))}
                            </div>
                            <div className="topbar-color-control">
                                <input aria-label="Couleur personnalisée de la barre supérieure" type="color" value={topbarColor} onChange={e => darkMode ? setDarkTopbarColor(e.target.value) : setLightTopbarColor(e.target.value)} />
                                <span>{topbarColor.toUpperCase()}</span>
                                <button type="button" className="settings-btn-outline" onClick={() => darkMode ? setDarkTopbarColor("#10111a") : setLightTopbarColor("#ffffff")}>Réinitialiser</button>
                            </div>
                            <p className="topbar-theme-note">Les couleurs sombres et claires sont enregistrées séparément.</p>
                        </div>
                    </SettingRow>

                    <SettingRow wide icon="🌌" title={t(language, "settings.background")} desc={t(language, "settings.backgroundDesc")}>
                        <div className="bg-mode-tabs" role="group" aria-label="Mode de fond">
                            <button type="button" className={darkMode ? "active" : ""} onClick={() => setDarkMode(true)}>🌙 Thèmes sombres</button>
                            <button type="button" className={!darkMode ? "active" : ""} onClick={() => setDarkMode(false)}>☀️ Thèmes clairs</button>
                        </div>
                        <div className="bg-picker" role="radiogroup" aria-label={darkMode ? "Choisir un thème sombre" : "Choisir un thème clair"}>
                            {Object.entries(darkMode ? BG_PRESETS : LIGHT_BG_PRESETS).map(([key, preset]) => (
                                <button
                                    key={key}
                                    type="button"
                                    role="radio"
                                    aria-checked={(darkMode ? darkBgPreset : lightBgPreset) === key}
                                    aria-label={`${darkMode ? "Thème sombre" : "Thème clair"} ${preset.label}`}
                                    className={`bg-preset-option ${(darkMode ? darkBgPreset : lightBgPreset) === key ? "selected" : ""}`}
                                    onClick={() => { if (darkMode) { setDarkBgPreset(key); localStorage.setItem("grindly-bg-dark", key); } else { setLightBgPreset(key); localStorage.setItem("grindly-bg-light", key); } }}
                                >
                                    <span className="bg-preset-preview" style={{ background: preset.bg }}>
                                        <span className="bg-preset-preview-card" style={{ background: preset.card, borderColor: preset.surface }}>
                                            <span className="bg-preset-preview-line" />
                                            <span className="bg-preset-preview-line short" />
                                        </span>
                                        <span className="bg-preset-accent" style={{ background: accentColor }} />
                                    </span>
                                    <span className="bg-preset-label">{preset.label}</span>
                                    {(darkMode ? darkBgPreset : lightBgPreset) === key && <span className="bg-preset-check" aria-hidden="true">✓</span>}
                                </button>
                            ))}
                        </div>
                    </SettingRow>

                    <SettingRow icon="🌍" title={t(language, "settings.language")} desc={t(language, "settings.languageDesc")}>
                        <select
                            className="settings-select"
                            value={language}
                            onChange={e => { const next = e.target.value as GrindlyLanguage; setLanguage(next); applyLanguage(next); }}
                        >
                            {LANGUAGES.map(item => <option key={item.value} value={item.value}>{item.flag} {item.label}</option>)}
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
                            Grindly ne revend jamais tes données à des tiers.
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
                                Pour toute question : <strong>privacy@grindly.app</strong> — Réponse sous 30 jours (délai légal RGPD).
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
                    <p>Grindly respecte ta vie privée. Aucune publicité, aucune revente de données.</p>
                    <div className="settings-footer-links">
                        <a href="/politique-confidentialite" className="settings-footer-link">Politique de confidentialité</a>
                        <span>·</span>
                        <a href="/cgu" className="settings-footer-link">CGU</a>
                        <span>·</span>
                        <a href="mailto:privacy@grindly.app" className="settings-footer-link">Contact DPO</a>
                    </div>
                </div>

            </main>
        </div>
    )
}
