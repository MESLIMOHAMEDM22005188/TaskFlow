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

export default function Navbar({ rightExtra, notifCount = 0 }: NavbarProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    function isActive(path: string) {
        return pathname === path || pathname.startsWith(path + "/");
    }

    return (
        <header className="topbar">
            <div
                className="logo"
                onClick={() => navigate("/dashboard")}
            >
                TaskFlow
            </div>

            <nav className="nav-menu">
                {NAV_ITEMS.map(item => (
                    <div
                        key={item.path}
                        className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.label}
                    </div>
                ))}

                <div className="nav-icons">
                    <div className="nav-item nav-search">
                        🔍
                    </div>

                    <div className="nav-item nav-notif">
                        🔔
                        {notifCount > 0 && (
                            <span className="notif-badge">
                                {notifCount}
                            </span>
                        )}
                    </div>

                    {rightExtra}
                </div>
            </nav>
        </header>
    );
}