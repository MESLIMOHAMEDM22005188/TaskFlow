import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { ReactNode, TouchEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { getTasks, getPreferences, savePreferences } from "../services/taskService";
import type { Task, UserPreferences } from "../services/taskService";
import "../assets/css/navbar.css";

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

type NavbarProps = {
    rightExtra?: ReactNode;
    notifCount?: number;
};

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

function applyPreferencesTheme(prefs: Partial<UserPreferences>) {
    const root = document.documentElement;
    const accent = typeof prefs.accent_color === "string" && /^#[0-9a-f]{6}$/i.test(prefs.accent_color)
        ? prefs.accent_color : "#6366f1";
    const dark = prefs.dark_mode !== false;
    const preset = BG_PRESETS[prefs.bg_preset || "navy"] ?? BG_PRESETS.navy;
    const rgb = [1, 3, 5].map(i => parseInt(accent.slice(i, i + 2), 16)).join(", ");
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-rgb", rgb);
    root.style.setProperty("--bg", dark ? preset.bg : "#f4f4f7");
    root.style.setProperty("--bg-card", dark ? preset.card : "rgba(0,0,0,0.03)");
    root.style.setProperty("--bg-surface", dark ? preset.surface : "rgba(0,0,0,0.05)");
    root.classList.toggle("light-mode", !dark);
    localStorage.setItem("grindly-theme", dark ? "dark" : "light");
    localStorage.setItem("grindly-bg-preset", prefs.bg_preset || "navy");
    window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: !dark } }));
}

function normalized(value: string) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

export default function Navbar({ rightExtra, notifCount = 0 }: NavbarProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
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
        const currentBg = getComputedStyle(root).getPropertyValue("--bg").trim();
        const presetEntry = Object.entries(BG_PRESETS).find(([, preset]) => preset.bg === currentBg);
        const bgPreset = localStorage.getItem("grindly-bg-preset") || presetEntry?.[0] || "navy";
        root.style.setProperty("--accent", storedAccent);
        root.style.setProperty("--accent-rgb", storedRgb);
        root.classList.toggle("light-mode", nextLight);
        root.style.setProperty("--bg", nextLight ? "#f4f4f7" : BG_PRESETS[bgPreset].bg);
        root.style.setProperty("--bg-card", nextLight ? "rgba(0,0,0,0.03)" : BG_PRESETS[bgPreset].card);
        root.style.setProperty("--bg-surface", nextLight ? "rgba(0,0,0,0.05)" : BG_PRESETS[bgPreset].surface);
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
        getPreferences().then(prefs => applyPreferencesTheme(prefs)).catch(() => {
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
        <button className="theme-button" type="button" onClick={toggleTheme} aria-label={lightMode ? "Activer le mode sombre" : "Activer le mode clair"}>
            <span className="theme-button-icon" aria-hidden="true">{lightMode ? "☾" : "☼"}</span>
            <span>{lightMode ? "Mode sombre" : "Mode clair"}</span>
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
                        {item.label}
                    </button>
                ))}
                <div className="nav-icons">
                    <button type="button" className={`nav-item nav-search ${searchOpen ? "active" : ""}`} aria-label="Ouvrir la recherche" aria-expanded={searchOpen} onClick={() => void openSearch()}>⌕</button>
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
                            {item.label}
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
                                placeholder="Rechercher une page ou une tâche…"
                                aria-label="Rechercher une page ou une tâche"
                            />
                            <kbd>Échap</kbd>
                        </div>
                        <div className="global-search-results">
                            {query.length < 2 && <p className="global-search-hint">Accès rapide aux pages. Tape au moins 2 caractères pour rechercher une tâche.</p>}
                            {matchingPages.length > 0 && (
                                <div className="global-search-group">
                                    <p className="global-search-label">Pages</p>
                                    {matchingPages.map(item => (
                                        <button type="button" key={item.path} className="global-search-result" onClick={() => { navigate(item.path); setSearchOpen(false); setSearchTerm(""); }}>
                                            <span className="global-search-result-icon">↗</span>
                                            <span>{item.label}</span>
                                            <span className="global-search-result-path">{item.path}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {query.length >= 2 && (
                                <div className="global-search-group">
                                    <p className="global-search-label">Tâches</p>
                                    {searchLoading && <p className="global-search-hint">Recherche dans tes tâches…</p>}
                                    {!searchLoading && matchingTasks.map(task => (
                                        <button type="button" key={task.id} className="global-search-result" onClick={() => openTask(task)}>
                                            <span className="global-search-result-icon">✓</span>
                                            <span>{task.title}</span>
                                            <span className="global-search-result-path">Ouvrir</span>
                                        </button>
                                    ))}
                                    {!searchLoading && !searchError && matchingTasks.length === 0 && <p className="global-search-hint">Aucune tâche correspondante.</p>}
                                    {searchError && <p className="global-search-hint">Impossible de charger les tâches. Réessaie après reconnexion.</p>}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </header>
    );
}
