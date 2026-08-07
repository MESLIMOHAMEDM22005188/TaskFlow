import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
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

export default function Navbar({
                                   rightExtra,
                                   notifCount = 0,
                               }: NavbarProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [menuOpen, setMenuOpen] = useState(false);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    function openMenu() {
        setMenuOpen(true);
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    function goTo(path: string) {
        navigate(path);
        closeMenu();
    }

    function isActive(path: string) {
        return pathname === path || pathname.startsWith(path + "/");
    }

    // Ferme le menu si on repasse en desktop (resize) pour éviter un état bloqué
    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 900) {
                closeMenu();
            }
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Bloque le scroll du body pendant que le menu mobile est ouvert
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "auto";

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [menuOpen]);

    // Ferme le menu avec la touche Echap
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") closeMenu();
        }
        if (menuOpen) {
            document.addEventListener("keydown", handleKeyDown);
        }
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [menuOpen]);

    // Swipe vers la gauche pour fermer le panneau mobile
    function handleTouchStart(e: React.TouchEvent) {
        touchStartX.current = e.touches[0].clientX;
    }

    function handleTouchMove(e: React.TouchEvent) {
        touchEndX.current = e.touches[0].clientX;
    }

    function handleTouchEnd() {
        const delta = touchStartX.current - touchEndX.current;
        if (delta > 60) {
            closeMenu();
        }
        touchStartX.current = 0;
        touchEndX.current = 0;
    }

    return (
        <header className="topbar">
            <div className="logo" onClick={() => goTo("/dashboard")}>
                Grindlyy
            </div>

            {/* Navigation desktop */}
            <nav className="nav-menu">
                {NAV_ITEMS.map((item) => (
                    <div
                        key={item.path}
                        className={`nav-item ${
                            isActive(item.path) ? "active" : ""
                        }`}
                        onClick={() => goTo(item.path)}
                    >
                        {item.label}
                    </div>
                ))}

                <div className="nav-icons">
                    <div className="nav-item nav-search" aria-label="Rechercher">
                        🔍
                    </div>

                    <div className="nav-item nav-notif" aria-label="Notifications">
                        🔔
                        {notifCount > 0 && (
                            <span className="notif-badge">{notifCount}</span>
                        )}
                    </div>

                    {rightExtra}
                </div>
            </nav>

            {/* Icônes toujours visibles + burger sur mobile */}
            <div className="topbar-mobile-actions">
                <div className="nav-item nav-notif mobile-only" aria-label="Notifications">
                    🔔
                    {notifCount > 0 && (
                        <span className="notif-badge">{notifCount}</span>
                    )}
                </div>

                <button
                    className={`burger ${menuOpen ? "burger-open" : ""}`}
                    onClick={openMenu}
                    aria-label="Ouvrir le menu"
                    aria-expanded={menuOpen}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {/* Overlay + panneau mobile */}
            <div
                className={`mobile-overlay ${menuOpen ? "visible" : ""}`}
                onClick={closeMenu}
            />

            <div
                className={`mobile-panel ${menuOpen ? "open" : ""}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="mobile-panel-header">
                    <div className="logo">Grindlyy</div>
                    <button
                        className="mobile-close"
                        onClick={closeMenu}
                        aria-label="Fermer le menu"
                    >
                        ✕
                    </button>
                </div>

                <nav className="mobile-nav-list">
                    {NAV_ITEMS.map((item) => (
                        <div
                            key={item.path}
                            className={`mobile-nav-item ${
                                isActive(item.path) ? "active" : ""
                            }`}
                            onClick={() => goTo(item.path)}
                        >
                            {item.label}
                        </div>
                    ))}
                </nav>

                <div className="mobile-panel-footer">
                    <div className="nav-item nav-search">🔍 Rechercher</div>
                    {rightExtra}
                </div>
            </div>
        </header>
    );
}