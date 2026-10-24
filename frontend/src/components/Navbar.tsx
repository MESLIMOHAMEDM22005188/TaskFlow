import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { ReactNode, TouchEvent } from "react";
import "../assets/css/navbar.css";

const NAV_ITEMS = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/objectifs", label: "Objectifs" },
    { path: "/flow", label: "Flow" },
    { path: "/stats", label: "Stats" },
    { path: "/habitudes", label: "Habitudes" },
    { path: "/profil", label: "Profil" },
    { path: "/communaute", label: "Communauté" },
    { path: "/historique", label: "Historique" },
    { path: "/parametres", label: "Paramètres" },
];

type NavbarProps = {
    rightExtra?: ReactNode;
    notifCount?: number;
};

export default function Navbar({ rightExtra, notifCount = 0 }: NavbarProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [lightMode, setLightMode] = useState(
        () => typeof document !== "undefined" && document.documentElement.classList.contains("light-mode")
    );
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
    function toggleTheme() {
        const nextLight = !document.documentElement.classList.contains("light-mode");
        document.documentElement.classList.toggle("light-mode", nextLight);
        localStorage.setItem("grindly-theme", nextLight ? "light" : "dark");
        setLightMode(nextLight);
        window.dispatchEvent(new CustomEvent("grindly-theme-change", { detail: { lightMode: nextLight } }));
    }

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 900) closeMenu();
        }
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
            if (e.key === "Escape") closeMenu();
        }
        if (menuOpen) document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [menuOpen]);

    useEffect(() => {
        const syncTheme = () => setLightMode(document.documentElement.classList.contains("light-mode"));
        window.addEventListener("grindly-theme-change", syncTheme);
        return () => window.removeEventListener("grindly-theme-change", syncTheme);
    }, []);

    function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
        touchStartX.current = e.touches[0].clientX;
    }
    function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
        touchEndX.current = e.touches[0].clientX;
    }
    function handleTouchEnd() {
        if (touchStartX.current - touchEndX.current > 60) closeMenu();
        touchStartX.current = 0;
        touchEndX.current = 0;
    }

    const themeButton = (
        <button className="theme-button" type="button" onClick={toggleTheme} aria-label={lightMode ? "Activer le mode sombre" : "Activer le mode clair"}>
            <span aria-hidden="true">{lightMode ? "☾" : "☼"}</span>
            {lightMode ? "Mode sombre" : "Mode clair"}
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
                    <button type="button" className="nav-item nav-search" aria-label="Rechercher">⌕</button>
                    <button type="button" className="nav-item nav-notif" aria-label={`Notifications : ${notifCount}`}>
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
        </header>
    );
}
