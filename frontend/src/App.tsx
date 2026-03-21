import { Routes, Route } from "react-router-dom"

import {AuthChoice} from "./pages/AuthChoice"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import { Dashboard } from "./pages/Dashboard"
import Objectifs from "./pages/Objectifs"
import Flow from "./pages/Flow"
import Profil from "./pages/Profil" // ✅ corrigé
import Habitudes from "./pages/Habitudes"

import Communaute from "./pages/Communaute"
import Parametres from "./pages/Parametres"
import Stats from "./pages/Stats"
import Historique from "./pages/Historique.tsx"; // ✅ ajouté
function App() {
    return (
        <Routes>
            <Route path="/" element={<AuthChoice />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/objectifs" element={<Objectifs />} />
            <Route path="/flow" element={<Flow />} />
            <Route path="/profil" element={<Profil />} />
            <Route path="/communaute" element={<Communaute />} />
            <Route path="/parametres" element={<Parametres />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/habitudes" element={<Habitudes />} />
            <Route path="/historique" element={<Historique />} />

        </Routes>
    )
}
// ── À ajouter dans App.tsx ────────────────────────────────────
// Charge et applique le thème dès le démarrage de l'app
// avant que la page ne s'affiche (évite le flash de couleur)

import { useEffect } from "react"
import { getPreferences } from "./services/taskService"

// Dans ton composant App, ajoute ce useEffect :
useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return // pas connecté, thème par défaut

    getPreferences().then(prefs => {
        const root = document.documentElement

        // Accent
        root.style.setProperty("--accent", prefs.accent_color)
        const r = parseInt(prefs.accent_color.slice(1,3), 16)
        const g = parseInt(prefs.accent_color.slice(3,5), 16)
        const b = parseInt(prefs.accent_color.slice(5,7), 16)
        root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`)

        // Background
        const BG_PRESETS: Record<string, { bg: string; card: string; surface: string }> = {
            obsidian:  { bg: "#0a0a0f", card: "rgba(255,255,255,0.035)", surface: "rgba(255,255,255,0.06)" },
            navy:      { bg: "#0f172a", card: "rgba(255,255,255,0.03)",  surface: "rgba(255,255,255,0.06)" },
            charcoal:  { bg: "#18181b", card: "rgba(255,255,255,0.04)",  surface: "rgba(255,255,255,0.07)" },
            midnight:  { bg: "#050d1a", card: "rgba(99,120,255,0.06)",   surface: "rgba(99,120,255,0.1)"   },
            abyss:     { bg: "#03111a", card: "rgba(0,150,200,0.06)",    surface: "rgba(0,150,200,0.1)"    },
            forest:    { bg: "#071510", card: "rgba(34,197,94,0.05)",    surface: "rgba(34,197,94,0.09)"   },
            ember:     { bg: "#180d08", card: "rgba(239,100,68,0.06)",   surface: "rgba(239,100,68,0.1)"   },
            wine:      { bg: "#150812", card: "rgba(200,50,100,0.06)",   surface: "rgba(200,50,100,0.1)"   },
            dusk:      { bg: "#130d1f", card: "rgba(168,85,247,0.06)",   surface: "rgba(168,85,247,0.1)"   },
        }
        const preset = BG_PRESETS[prefs.bg_preset] ?? BG_PRESETS.navy
        const dark = !!prefs.dark_mode
        root.style.setProperty("--bg",         dark ? preset.bg      : "#f4f4f7")
        root.style.setProperty("--bg-card",    dark ? preset.card    : "rgba(0,0,0,0.03)")
        root.style.setProperty("--bg-surface", dark ? preset.surface : "rgba(0,0,0,0.05)")
        root.classList.toggle("light-mode", !dark)
    }).catch(() => {}) // silencieux si pas connecté
}, [])

export default App