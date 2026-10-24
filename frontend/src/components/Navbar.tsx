import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { ReactNode, TouchEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { getTasks, getPreferences, savePreferences } from "../services/taskService";
import type { Task, UserPreferences } from "../services/taskService";
import "../assets/css/navbar.css";
import { getLanguage, t, type GrindlyLanguage } from "../i18n";

const NAV_ITEMS = [
    { path: "/dashboard", label: "Dashboard", keywords: "accueil tâches tâche travail" },
    { path: "/objectifs", label: "Objectifs", keywords: "but cible progression" },
    { path: "/flow", label: "Flow", keywords: "pomodoro concentration focus minuteur" },
    { path: "/stats", label: "Stats", keywords: "statistiques graphiques xp analyse" },
    { path: "/habitudes", label: "Habitudes", keywords: "routine suivi quotidien" },
    { path: "/profil", label: "Profil", keywords: "compte avatar informations" },
    { path: "/communaute", label: "Communauté", keywords: "groupes publications discussions" },
    { path: "/historique", label: "Historique", keywords: "archives terminées passées" },
    { path: "/parametres", label: "Paramètres", keywords: "préférences apparence thème sombre clair" },
];

const NAV_TRANSLATION_KEYS = { "/dashboard":"nav.dashboard", "/objectifs":"nav.objectifs", "/flow":"nav.flow", "/stats":"nav.stats", "/habitudes":"nav.habitudes", "/profil":"nav.profil", "/communaute":"nav.communaute", "/historique":"nav.historique", "/parametres":"nav.parametres" } as const;

type NavbarProps = {
    rightExtra?: ReactNode;
    notifCount?: number;
};

const BG_PRESETS: Record<string, { bg: string; card: string; surface: string }> = {
    obsidian:{bg:"#0a0a0f",card:"rgba(255,255,255,0.035)",surface:"rgba(255,255,255,0.06)"}, navy:{bg:"#0f172a",card:"rgba(255,255,255,0.03)",surface:"rgba(255,255,255,0.06)"}, charcoal:{bg:"#18181b",card:"rgba(255,255,255,0.04)",surface:"rgba(255,255,255,0.07)"}, midnight:{bg:"#050d1a",card:"rgba(99,120,255,0.06)",surface:"rgba(99,120,255,0.1)"}, abyss:{bg:"#03111a",card:"rgba(0,150,200,0.06)",surface:"rgba(0,150,200,0.1)"}, forest:{bg:"#071510",card:"rgba(34,197,94,0.05)",surface:"rgba(34,197,94,0.09)"}, ember:{bg:"#180d08",card:"rgba(239,100,68,0.06)",surface:"rgba(239,100,68,0.1)"}, wine:{bg:"#150812",card:"rgba(200,50,100,0.06)",surface:"rgba(200,50,100,0.1)"}, dusk:{bg:"#130d1f",card:"rgba(168,85,247,0.06)",surface:"rgba(168,85,247,0.1)"}, slate:{bg:"#111827",card:"rgba(148,163,184,0.06)",surface:"rgba(148,163,184,0.11)"}, graphite:{bg:"#20252e",card:"rgba(203,213,225,0.05)",surface:"rgba(203,213,225,0.09)"}, ocean:{bg:"#062b3a",card:"rgba(34,211,238,0.06)",surface:"rgba(34,211,238,0.11)"}, arctic:{bg:"#0b2233",card:"rgba(125,211,252,0.07)",surface:"rgba(125,211,252,0.12)"}, indigo:{bg:"#16123a",card:"rgba(129,140,248,0.07)",surface:"rgba(129,140,248,0.13)"}, lavender:{bg:"#211a35",card:"rgba(196,181,253,0.06)",surface:"rgba(196,181,253,0.11)"}, plum:{bg:"#2a102b",card:"rgba(232,121,249,0.06)",surface:"rgba(232,121,249,0.11)"}, rose:{bg:"#30131f",card:"rgba(251,113,133,0.06)",surface:"rgba(251,113,133,0.11)"}, cocoa:{bg:"#2a1d18",card:"rgba(214,175,145,0.06)",surface:"rgba(214,175,145,0.11)"}, copper:{bg:"#2b1a13",card:"rgba(251,146,60,0.06)",surface:"rgba(251,146,60,0.11)"}, emerald:{bg:"#06251d",card:"rgba(52,211,153,0.06)",surface:"rgba(52,211,153,0.11)"}, moss:{bg:"#172315",card:"rgba(163,190,110,0.06)",surface:"rgba(163,190,110,0.11)"}, cobalt:{bg:"#0b1f4d",card:"rgba(96,165,250,0.07)",surface:"rgba(96,165,250,0.12)"}, twilight:{bg:"#211747",card:"rgba(167,139,250,0.07)",surface:"rgba(167,139,250,0.12)"}, cherry:{bg:"#350d18",card:"rgba(251,113,133,0.06)",surface:"rgba(251,113,133,0.12)"}, sand:{bg:"#2b251b",card:"rgba(217,187,133,0.06)",surface:"rgba(217,187,133,0.11)"}, petrol:{bg:"#062e2e",card:"rgba(45,212,191,0.06)",surface:"rgba(45,212,191,0.11)"}, smoke:{bg:"#24272e",card:"rgba(161,161,170,0.06)",surface:"rgba(161,161,170,0.11)"}, garnet:{bg:"#2c1114",card:"rgba(248,113,113,0.06)",surface:"rgba(248,113,113,0.11)"}
};
const LIGHT_BG_PRESETS: Record<string, { bg: string; card: string; surface: string }> = {
    pearl:{bg:"#f5f7fb",card:"rgba(255,255,255,0.92)",surface:"rgba(255,255,255,0.98)"}, snow:{bg:"#ffffff",card:"rgba(248,250,252,0.98)",surface:"rgba(241,245,249,0.96)"}, mist:{bg:"#edf2f7",card:"rgba(255,255,255,0.9)",surface:"rgba(226,232,240,0.72)"}, sand:{bg:"#f6f0e5",card:"rgba(255,255,255,0.82)",surface:"rgba(235,224,204,0.72)"}, lavender:{bg:"#f2efff",card:"rgba(255,255,255,0.86)",surface:"rgba(221,214,254,0.6)"}, rose:{bg:"#fff0f3",card:"rgba(255,255,255,0.88)",surface:"rgba(251,207,232,0.5)"}, sage:{bg:"#edf5ef",card:"rgba(255,255,255,0.88)",surface:"rgba(187,222,195,0.48)"}, sky:{bg:"#eaf5ff",card:"rgba(255,255,255,0.9)",surface:"rgba(186,230,253,0.55)"}, peach:{bg:"#fff1e8",card:"rgba(255,255,255,0.9)",surface:"rgba(254,215,170,0.52)"}, mint:{bg:"#e8faf5",card:"rgba(255,255,255,0.9)",surface:"rgba(153,246,228,0.42)"}, butter:{bg:"#fff9df",card:"rgba(255,255,255,0.9)",surface:"rgba(254,240,138,0.4)"}, stone:{bg:"#f0efed",card:"rgba(255,255,255,0.9)",surface:"rgba(214,211,209,0.5)"}
};
function applyPreferencesTheme(prefs: Partial<UserPreferences>) {
    const root = document.documentElement;
    const accent = typeof prefs.accent_color === "string" && /^#[0-9a-f]{6}$/i.test(prefs.accent_color) ? prefs.accent_color : "#6366f1";
    const savedTheme = localStorage.getItem("grindly-theme");
    const dark = savedTheme ? savedTheme === "dark" : prefs.dark_mode !== false;
    const savedPreset = localStorage.getItem(dark ? "grindly-bg-dark" : "grindly-bg-light");
    const legacyPreset = localStorage.getItem("grindly-bg-preset") || prefs.bg_preset || "navy";
    const presets = dark ? BG_PRESETS : LIGHT_BG_PRESETS;
    const fallback = dark ? "navy" : "pearl";
    const key = savedPreset && presets[savedPreset] ? savedPreset : (presets[legacyPreset] ? legacyPreset : fallback);
    const preset = presets[key] || presets[fallback];
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-rgb", [1,3,5].map(i => parseInt(accent.slice(i,i+2),16)).join(", "));
    root.style.setProperty("--bg", preset.bg);
    root.style.setProperty("--bg-card", preset.card);
    root.style.setProperty("--bg-surface", preset.surface);
    const topbar = localStorage.getItem(dark ? "grindly-topbar-dark" : "grindly-topbar-light") || localStorage.getItem("grindly-topbar-color") || (dark ? "#10111a" : "#ffffff");
    root.style.setProperty("--topbar-custom-bg", topbar);
    // Compute navigation foreground colors from the selected bar color on every page load.
    const topbarHex = topbar.replace("#", "");
    const topbarBrightness = (parseInt(topbarHex.slice(0, 2), 16) * 299
        + parseInt(topbarHex.slice(2, 4), 16) * 587
        + parseInt(topbarHex.slice(4, 6), 16) * 114) / 1000;
    const useLightText = topbarBrightness < 145;
    root.style.setProperty("--topbar-text", useLightText ? "#f8fafc" : "#20202b");
    root.style.setProperty("--topbar-muted", useLightText ? "#c4c8d4" : "#5b6170");
    root.style.setProperty("--topbar-border", useLightText ? "rgba(255,255,255,.14)" : "rgba(22,22,35,.13)");
    root.style.setProperty("--topbar-hover", useLightText ? "rgba(255,255,255,.09)" : "rgba(22,22,35,.07)");
    root.style.setProperty("--topbar-active-bg", useLightText ? "rgba(255,255,255,.14)" : "rgba(22,22,35,.09)");
    root.classList.toggle("light-mode", !dark);
    localStorage.setItem("grindly-theme", dark ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: !dark } }));
}
function normalized(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

export default function Navbar({ rightExtra, notifCount = 0 }: NavbarProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [language, setLanguage] = useState<GrindlyLanguage>(() => getLanguage());
    const [lightMode, setLightMode] = useState(
        () => typeof document !== "undefined" && document.documentElement.classList.contains("light-mode")
    );
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTasks, setSearchTasks] = useState<Task[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const searchInput = useRef<HTMLInputElement>(null);
    const tasksLoaded = useRef(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    function closeMenu() { setMenuOpen(false); }
    function goTo(path: string) {
        navigate(path);
        closeMenu();
    }
    function isActive(path: string) {
        return pathname === path || pathname.startsWith(path + "/");
    }

    async function openSearch() {
        setSearchOpen(true);
        closeMenu();
        window.setTimeout(() => searchInput.current?.focus(), 0);
        setSearchLoading(true);
        setSearchError(false);
        try {
            const tasks = await getTasks() as Task[];
            setSearchTasks(Array.isArray(tasks) ? tasks : []);
        } catch {
            setSearchError(true);
        } finally {
            setSearchLoading(false);
        }
    }

    function toggleTheme() {
        const nextLight = !document.documentElement.classList.contains("light-mode");
        const root = document.documentElement;
        const storedAccent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#6366f1";
        const storedRgb = storedAccent.match(/^#[0-9a-f]{6}$/i)
            ? [1, 3, 5].map(i => parseInt(storedAccent.slice(i, i + 2), 16)).join(", ")
            : "99, 102, 241";
        const savedPreset = localStorage.getItem(nextLight ? "grindly-bg-light" : "grindly-bg-dark");
        const legacyPreset = localStorage.getItem("grindly-bg-preset") || "navy";
        const presets = nextLight ? LIGHT_BG_PRESETS : BG_PRESETS;
        const fallback = nextLight ? "pearl" : "navy";
        const presetKey = savedPreset && presets[savedPreset] ? savedPreset : (presets[legacyPreset] ? legacyPreset : fallback);
        const preset = presets[presetKey] || presets[fallback];
        const topbar = localStorage.getItem(nextLight ? "grindly-topbar-light" : "grindly-topbar-dark") || (nextLight ? "#ffffff" : "#10111a");
        root.style.setProperty("--accent", storedAccent);
        root.style.setProperty("--accent-rgb", storedRgb);
        root.style.setProperty("--bg", preset.bg);
        root.style.setProperty("--bg-card", preset.card);
        root.style.setProperty("--bg-surface", preset.surface);
        root.style.setProperty("--topbar-custom-bg", topbar);
        const hex = topbar.replace("#", "");
        const brightness = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000;
        const lightText = brightness < 145;
        root.style.setProperty("--topbar-text", lightText ? "#f8fafc" : "#20202b");
        root.style.setProperty("--topbar-muted", lightText ? "#c4c8d4" : "#5b6170");
        root.style.setProperty("--topbar-border", lightText ? "rgba(255,255,255,.14)" : "rgba(22,22,35,.13)");
        root.style.setProperty("--topbar-hover", lightText ? "rgba(255,255,255,.09)" : "rgba(22,22,35,.07)");
        root.style.setProperty("--topbar-active-bg", lightText ? "rgba(255,255,255,.14)" : "rgba(22,22,35,.09)");
        root.classList.toggle("light-mode", nextLight);
        localStorage.setItem("grindly-theme", nextLight ? "light" : "dark");
        setLightMode(nextLight);
        window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: nextLight } }));
        savePreferences({ dark_mode: !nextLight }).catch(error => {
            console.error("Impossible de sauvegarder le thème", error);
        });
    }

    const query = normalized(searchTerm.trim());
    const matchingPages = useMemo(() => {
        if (!query) return NAV_ITEMS.slice(0, 4);
        return NAV_ITEMS.filter(item => normalized(item.label + " " + item.keywords).includes(query)).slice(0, 5);
    }, [query]);
    const matchingTasks = useMemo(() => {
        if (query.length < 2) return [];
        return searchTasks
            .filter(task => normalized(task.title || "").includes(query))
            .slice(0, 6);
    }, [query, searchTasks]);

    function openTask(task: Task) {
        setSearchOpen(false);
        setSearchTerm("");
        navigate("/dashboard?search=" + encodeURIComponent(task.title));
    }

    function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (event.key === "Escape") {
            setSearchOpen(false);
            setSearchTerm("");
        } else if (event.key === "Enter") {
            if (matchingTasks.length) openTask(matchingTasks[0]);
            else if (matchingPages.length) {
                navigate(matchingPages[0].path);
                setSearchOpen(false);
                setSearchTerm("");
            }
        }
    }

    useEffect(() => {
        getPreferences().then(prefs => {
            const savedTheme = localStorage.getItem("grindly-theme");
            const storedPreset = localStorage.getItem("grindly-bg-preset");
            const legacyBgPresets: Record<string, string> = { dark: "navy", darker: "obsidian", warm: "cocoa" };
            const normalizedPreset = storedPreset
                ? (BG_PRESETS[storedPreset] ? storedPreset : legacyBgPresets[storedPreset])
                : undefined;
            applyPreferencesTheme({
                ...prefs,
                ...(savedTheme ? { dark_mode: savedTheme === "dark" } : {}),
                ...(normalizedPreset ? { bg_preset: normalizedPreset } : {}),
            });
        }).catch(() => {
            const saved = localStorage.getItem("grindly-theme");
            if (saved) {
                const light = saved === "light";
                document.documentElement.classList.toggle("light-mode", light);
                setLightMode(light);
                window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: light } }));
            }
        });
    }, []);

    useEffect(() => {
        const handleResize = () => { if (window.innerWidth > 900) closeMenu(); };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = previousOverflow; };
    }, [menuOpen]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                closeMenu();
                setSearchOpen(false);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                void openSearch();
            }
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const syncLanguage = (event: Event) => setLanguage(((event as CustomEvent<{language?: GrindlyLanguage}>).detail?.language || getLanguage()));
        window.addEventListener("grindly-language-change", syncLanguage);
        return () => window.removeEventListener("grindly-language-change", syncLanguage);
    }, []);

    useEffect(() => {
        const syncTheme = (event: Event) => {
            const customEvent = event as CustomEvent<{ lightMode?: boolean }>;
            setLightMode(customEvent.detail?.lightMode ?? document.documentElement.classList.contains("light-mode"));
        };
        window.addEventListener("grindly-theme-change", syncTheme);
        return () => window.removeEventListener("grindly-theme-change", syncTheme);
    }, []);

    function handleTouchStart(e: TouchEvent<HTMLDivElement>) { touchStartX.current = e.touches[0].clientX; }
    function handleTouchMove(e: TouchEvent<HTMLDivElement>) { touchEndX.current = e.touches[0].clientX; }
    function handleTouchEnd() {
        if (touchStartX.current - touchEndX.current > 60) closeMenu();
        touchStartX.current = 0;
        touchEndX.current = 0;
    }

    const themeButton = (
        <button className="theme-button" type="button" onClick={toggleTheme} aria-label={lightMode ? t(language, "theme.dark") : t(language, "theme.light")}>
            <span className="theme-button-icon" aria-hidden="true">{lightMode ? "☾" : "☼"}</span>
            <span>{lightMode ? t(language, "theme.dark") : t(language, "theme.light")}</span>
        </button>
    );

    return (
        <header className="topbar">
            <button className="logo" type="button" onClick={() => goTo("/dashboard")} aria-label="Grindly, accueil">
                Grindly
            </button>

            <nav className="nav-menu" aria-label="Navigation principale">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.path}
                        type="button"
                        className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => goTo(item.path)}
                        aria-current={isActive(item.path) ? "page" : undefined}
                    >
                        {t(language, NAV_TRANSLATION_KEYS[item.path as keyof typeof NAV_TRANSLATION_KEYS])}
                    </button>
                ))}
                <div className="nav-icons">
                    <button type="button" className={`nav-item nav-search ${searchOpen ? "active" : ""}`} aria-label={t(language, "search.open")} aria-expanded={searchOpen} onClick={() => void openSearch()}>⌕</button>
                    <button type="button" className="nav-item nav-notif" aria-label={`Notifications : ${notifCount}`} title={notifCount ? `${notifCount} notifications` : "Aucune nouvelle notification"}>
                        ♧
                        {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
                    </button>
                    {themeButton}
                    {rightExtra}
                </div>
            </nav>

            <div className="topbar-mobile-actions">
                {notifCount > 0 && (
                    <button type="button" className="nav-item nav-notif mobile-only" aria-label={`${notifCount} notifications`}>
                        ♧<span className="notif-badge">{notifCount}</span>
                    </button>
                )}
                <button
                    className={`burger ${menuOpen ? "burger-open" : ""}`}
                    type="button"
                    onClick={() => setMenuOpen(open => !open)}
                    aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={menuOpen}
                    aria-controls="grindly-mobile-menu"
                >
                    <span /><span /><span />
                </button>
            </div>

            <div className={`mobile-overlay ${menuOpen ? "visible" : ""}`} onClick={closeMenu} aria-hidden="true" />
            <div
                id="grindly-mobile-menu"
                className={`mobile-panel ${menuOpen ? "open" : ""}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                aria-hidden={!menuOpen}
            >
                <div className="mobile-panel-header">
                    <div className="logo">Grindly</div>
                    <button className="mobile-close" type="button" onClick={closeMenu} aria-label="Fermer le menu">×</button>
                </div>
                <button type="button" className="mobile-search-trigger" onClick={() => void openSearch()}>⌕ Rechercher une page ou une tâche</button>
                <nav className="mobile-nav-list" aria-label="Navigation mobile">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.path}
                            type="button"
                            className={`mobile-nav-item ${isActive(item.path) ? "active" : ""}`}
                            onClick={() => goTo(item.path)}
                            aria-current={isActive(item.path) ? "page" : undefined}
                            tabIndex={menuOpen ? 0 : -1}
                        >
                            {t(language, NAV_TRANSLATION_KEYS[item.path as keyof typeof NAV_TRANSLATION_KEYS])}
                        </button>
                    ))}
                </nav>
                <div className="mobile-panel-footer">
                    {themeButton}
                    {rightExtra}
                </div>
            </div>

            {searchOpen && (
                <div className="global-search-backdrop" onMouseDown={event => {
                    if (event.target === event.currentTarget) setSearchOpen(false);
                }}>
                    <section className="global-search" role="dialog" aria-modal="true" aria-label="Recherche globale">
                        <div className="global-search-input-wrap">
                            <span aria-hidden="true">⌕</span>
                            <input
                                ref={searchInput}
                                type="search"
                                value={searchTerm}
                                onChange={event => setSearchTerm(event.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={t(language, "search.placeholder")}
                                aria-label={t(language, "search.type")}
                            />
                            <kbd>{t(language, "search.min")}</kbd>
                        </div>
                        <div className="global-search-results">
                            {query.length < 2 && <p className="global-search-hint">{t(language, "search.quick")}</p>}
                            {matchingPages.length > 0 && (
                                <div className="global-search-group">
                                    <p className="global-search-label">{t(language, "search.pages")}</p>
                                    {matchingPages.map(item => (
                                        <button type="button" key={item.path} className="global-search-result" onClick={() => { navigate(item.path); setSearchOpen(false); setSearchTerm(""); }}>
                                            <span className="global-search-result-icon">↗</span>
                                            <span>{t(language, NAV_TRANSLATION_KEYS[item.path as keyof typeof NAV_TRANSLATION_KEYS])}</span>
                                            <span className="global-search-result-path">{item.path}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {query.length >= 2 && (
                                <div className="global-search-group">
                                    <p className="global-search-label">{t(language, "search.tasks")}</p>
                                    {searchLoading && <p className="global-search-hint">{t(language, "search.loading")}</p>}
                                    {!searchLoading && matchingTasks.map(task => (
                                        <button type="button" key={task.id} className="global-search-result" onClick={() => openTask(task)}>
                                            <span className="global-search-result-icon">✓</span>
                                            <span>{task.title}</span>
                                            <span className="global-search-result-path">{t(language, "search.openTask")}</span>
                                        </button>
                                    ))}
                                    {!searchLoading && !searchError && matchingTasks.length === 0 && <p className="global-search-hint">{t(language, "search.none")}</p>}
                                    {searchError && <p className="global-search-hint">{t(language, "search.error")}</p>}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </header>
    );
}
