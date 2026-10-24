import { useEffect, useState } from "react";

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
};

export function applySavedTheme() {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("grindly-theme");
    const dark = savedTheme ? savedTheme === "dark" : true;
    const presetKey = localStorage.getItem("grindly-bg-preset") || "navy";
    const preset = BG_PRESETS[presetKey] ?? BG_PRESETS.navy;
    root.classList.toggle("light-mode", !dark);
    root.style.setProperty("--bg", dark ? preset.bg : "#f4f4f7");
    root.style.setProperty("--bg-card", dark ? preset.card : "rgba(0,0,0,0.03)");
    root.style.setProperty("--bg-surface", dark ? preset.surface : "rgba(0,0,0,0.05)");
    window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: !dark } }));
}

export default function AuthThemeToggle() {
    const [lightMode, setLightMode] = useState(() => typeof document !== "undefined" && document.documentElement.classList.contains("light-mode"));

    useEffect(() => {
        applySavedTheme();
        const sync = (event: Event) => {
            const detail = (event as CustomEvent<{ lightMode?: boolean }>).detail;
            setLightMode(typeof detail?.lightMode === "boolean" ? detail.lightMode : document.documentElement.classList.contains("light-mode"));
        };
        window.addEventListener("grindly-theme-change", sync);
        return () => window.removeEventListener("grindly-theme-change", sync);
    }, []);

    function toggle() {
        const root = document.documentElement;
        const nextLight = !root.classList.contains("light-mode");
        const presetKey = localStorage.getItem("grindly-bg-preset") || "navy";
        const preset = BG_PRESETS[presetKey] ?? BG_PRESETS.navy;
        root.classList.toggle("light-mode", nextLight);
        root.style.setProperty("--bg", nextLight ? "#f4f4f7" : preset.bg);
        root.style.setProperty("--bg-card", nextLight ? "rgba(0,0,0,0.03)" : preset.card);
        root.style.setProperty("--bg-surface", nextLight ? "rgba(0,0,0,0.05)" : preset.surface);
        localStorage.setItem("grindly-theme", nextLight ? "light" : "dark");
        setLightMode(nextLight);
        window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: nextLight } }));
    }

    return (
        <button type="button" className="auth-theme-toggle" onClick={toggle} aria-label={lightMode ? "Activer le mode sombre" : "Activer le mode clair"} title={lightMode ? "Passer au mode sombre" : "Passer au mode clair"}>
            <span aria-hidden="true">{lightMode ? "☾" : "☀"}</span>
            <span>{lightMode ? "Mode clair" : "Mode sombre"}</span>
        </button>
    );
}
