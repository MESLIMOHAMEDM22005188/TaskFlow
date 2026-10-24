import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { getPreferences } from "./services/taskService"
import { applyLanguage, type GrindlyLanguage } from "./i18n"

import { AuthChoice } from "./pages/AuthChoice"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import { Dashboard } from "./pages/Dashboard"
import Objectifs from "./pages/Objectifs"
import Flow from "./pages/Flow"
import Profil from "./pages/Profil"
import Habitudes from "./pages/Habitudes"
import Communaute from "./pages/Communaute"
import Parametres from "./pages/Parametres"
import Stats from "./pages/Stats"
import Historique from "./pages/Historique"

const BG_PRESETS: Record<string, { bg: string; card: string; surface: string }> = {
    obsidian: { bg: "#0a0a0f", card: "rgba(255,255,255,0.035)", surface: "rgba(255,255,255,0.06)" },
    navy: { bg: "#0f172a", card: "rgba(255,255,255,0.03)", surface: "rgba(255,255,255,0.06)" },
    charcoal: { bg: "#18181b", card: "rgba(255,255,255,0.04)", surface: "rgba(255,255,255,0.07)" },
    midnight: { bg: "#050d1a", card: "rgba(99,120,255,0.06)", surface: "rgba(99,120,255,0.1)" },
    abyss: { bg: "#03111a", card: "rgba(0,150,200,0.06)", surface: "rgba(0,150,200,0.1)" },
    forest: { bg: "#071510", card: "rgba(34,197,94,0.05)", surface: "rgba(34,197,94,0.09)" },
    ember: { bg: "#180d08", card: "rgba(239,100,68,0.06)", surface: "rgba(239,100,68,0.1)" },
    wine: { bg: "#150812", card: "rgba(200,50,100,0.06)", surface: "rgba(200,50,100,0.1)" },
    dusk: { bg: "#130d1f", card: "rgba(168,85,247,0.06)", surface: "rgba(168,85,247,0.1)" },
    slate: { bg: "#111827", card: "rgba(148,163,184,0.06)", surface: "rgba(148,163,184,0.11)" },
    graphite: { bg: "#20252e", card: "rgba(203,213,225,0.05)", surface: "rgba(203,213,225,0.09)" },
    ocean: { bg: "#062b3a", card: "rgba(34,211,238,0.06)", surface: "rgba(34,211,238,0.11)" },
    arctic: { bg: "#0b2233", card: "rgba(125,211,252,0.07)", surface: "rgba(125,211,252,0.12)" },
    indigo: { bg: "#16123a", card: "rgba(129,140,248,0.07)", surface: "rgba(129,140,248,0.13)" },
    lavender: { bg: "#211a35", card: "rgba(196,181,253,0.06)", surface: "rgba(196,181,253,0.11)" },
    plum: { bg: "#2a102b", card: "rgba(232,121,249,0.06)", surface: "rgba(232,121,249,0.11)" },
    rose: { bg: "#30131f", card: "rgba(251,113,133,0.06)", surface: "rgba(251,113,133,0.11)" },
    cocoa: { bg: "#2a1d18", card: "rgba(214,175,145,0.06)", surface: "rgba(214,175,145,0.11)" },
    copper: { bg: "#2b1a13", card: "rgba(251,146,60,0.06)", surface: "rgba(251,146,60,0.11)" },
    emerald: { bg: "#06251d", card: "rgba(52,211,153,0.06)", surface: "rgba(52,211,153,0.11)" },
    moss: { bg: "#172315", card: "rgba(163,190,110,0.06)", surface: "rgba(163,190,110,0.11)" },
    cobalt: { bg: "#0b1f4d", card: "rgba(96,165,250,0.07)", surface: "rgba(96,165,250,0.12)" },
    twilight: { bg: "#211747", card: "rgba(167,139,250,0.07)", surface: "rgba(167,139,250,0.12)" },
    cherry: { bg: "#350d18", card: "rgba(251,113,133,0.06)", surface: "rgba(251,113,133,0.12)" },
    sand: { bg: "#2b251b", card: "rgba(217,187,133,0.06)", surface: "rgba(217,187,133,0.11)" },
    petrol: { bg: "#062e2e", card: "rgba(45,212,191,0.06)", surface: "rgba(45,212,191,0.11)" },
    smoke: { bg: "#24272e", card: "rgba(161,161,170,0.06)", surface: "rgba(161,161,170,0.11)" },
    garnet: { bg: "#2c1114", card: "rgba(248,113,113,0.06)", surface: "rgba(248,113,113,0.11)" },
}

const LIGHT_BG_PRESETS: Record<string, { bg: string; card: string; surface: string }> = {
    pearl:{bg:"#f5f7fb",card:"rgba(255,255,255,0.92)",surface:"rgba(255,255,255,0.98)"}, snow:{bg:"#ffffff",card:"rgba(248,250,252,0.98)",surface:"rgba(241,245,249,0.96)"}, mist:{bg:"#edf2f7",card:"rgba(255,255,255,0.9)",surface:"rgba(226,232,240,0.72)"}, sand:{bg:"#f6f0e5",card:"rgba(255,255,255,0.82)",surface:"rgba(235,224,204,0.72)"}, lavender:{bg:"#f2efff",card:"rgba(255,255,255,0.86)",surface:"rgba(221,214,254,0.6)"}, rose:{bg:"#fff0f3",card:"rgba(255,255,255,0.88)",surface:"rgba(251,207,232,0.5)"}, sage:{bg:"#edf5ef",card:"rgba(255,255,255,0.88)",surface:"rgba(187,222,195,0.48)"}, sky:{bg:"#eaf5ff",card:"rgba(255,255,255,0.9)",surface:"rgba(186,230,253,0.55)"}, peach:{bg:"#fff1e8",card:"rgba(255,255,255,0.9)",surface:"rgba(254,215,170,0.52)"}, mint:{bg:"#e8faf5",card:"rgba(255,255,255,0.9)",surface:"rgba(153,246,228,0.42)"}, butter:{bg:"#fff9df",card:"rgba(255,255,255,0.9)",surface:"rgba(254,240,138,0.4)"}, stone:{bg:"#f0efed",card:"rgba(255,255,255,0.9)",surface:"rgba(214,211,209,0.5)"}
};

function hasValidToken(): boolean {
    const token = localStorage.getItem("token")

    if (!token || token === "null" || token === "undefined") {
        return false
    }

    try {
        const parts = token.split(".")
        if (parts.length !== 3) return false

        const encodedPayload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
        const paddedPayload = encodedPayload.padEnd(
            encodedPayload.length + ((4 - encodedPayload.length % 4) % 4),
            "="
        )
        const payload = JSON.parse(atob(paddedPayload))

        // Grindly's backend creates JWTs with an "exp" claim (7 days).
        return typeof payload.exp === "number" && payload.exp * 1000 > Date.now()
    } catch {
        return false
    }
}

function RequireAuth({ children }: { children: React.ReactElement }) {
    if (!hasValidToken()) {
        localStorage.removeItem("token")
        return <Navigate to="/login" replace />
    }

    return children
}

function App() {

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) return

        getPreferences().then(prefs => {
            const root = document.documentElement

            const language = (localStorage.getItem("grindly-language") || prefs.language || "fr") as GrindlyLanguage
            applyLanguage(language)
            const topbarColor = localStorage.getItem("grindly-topbar-color")
            if (topbarColor && /^#[0-9a-f]{6}$/i.test(topbarColor)) root.style.setProperty("--topbar-custom-bg", topbarColor)

            // Accent color
            root.style.setProperty("--accent", prefs.accent_color)
            const r = parseInt(prefs.accent_color.slice(1, 3), 16)
            const g = parseInt(prefs.accent_color.slice(3, 5), 16)
            const b = parseInt(prefs.accent_color.slice(5, 7), 16)
            root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`)

            // Background — preserve locally selected preset across navigation/reloads.
            const savedBgPreset = localStorage.getItem(dark ? "grindly-bg-dark" : "grindly-bg-light") || localStorage.getItem("grindly-bg-preset")
            const requestedPreset = savedBgPreset || prefs.bg_preset || "navy"
            const legacyBgPresets: Record<string, string> = { dark: "navy", darker: "obsidian", warm: "cocoa" }
            const availablePresets = dark ? BG_PRESETS : LIGHT_BG_PRESETS
            const bgPresetKey = availablePresets[requestedPreset] ? requestedPreset : (dark ? (legacyBgPresets[requestedPreset] || "navy") : "pearl")
            const preset = availablePresets[bgPresetKey] ?? (dark ? BG_PRESETS.navy : LIGHT_BG_PRESETS.pearl)
            const savedTheme = localStorage.getItem("grindly-theme")
            const dark = savedTheme ? savedTheme === "dark" : !!prefs.dark_mode
            root.style.setProperty("--bg",         preset.bg)
            root.style.setProperty("--bg-card",    preset.card)
            root.style.setProperty("--bg-surface", preset.surface)
            root.classList.toggle("light-mode", !dark)
            localStorage.setItem("grindly-theme", dark ? "dark" : "light")
            window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: !dark } }))
        }).catch(() => {})
    }, [])

    return (
        <Routes>
            <Route path="/"           element={<AuthChoice />} />
            <Route path="/login"      element={<Login />} />
            <Route path="/signup"     element={<Signup />} />
            <Route path="/dashboard"  element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/objectifs"  element={<RequireAuth><Objectifs /></RequireAuth>} />
            <Route path="/flow"       element={<RequireAuth><Flow /></RequireAuth>} />
            <Route path="/profil"     element={<RequireAuth><Profil /></RequireAuth>} />
            <Route path="/communaute" element={<RequireAuth><Communaute /></RequireAuth>} />
            <Route path="/parametres" element={<RequireAuth><Parametres /></RequireAuth>} />
            <Route path="/stats"      element={<RequireAuth><Stats /></RequireAuth>} />
            <Route path="/habitudes"  element={<RequireAuth><Habitudes /></RequireAuth>} />
            <Route path="/historique" element={<RequireAuth><Historique /></RequireAuth>} />
        </Routes>
    )
}

export default App