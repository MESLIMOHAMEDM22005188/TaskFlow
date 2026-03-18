import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/parametres.css"
import { changePassword } from "../services/taskService"

export default function Parametres() {

    const navigate = useNavigate()
    const [notifications, setNotifications] = useState(true)
    const [darkMode, setDarkMode] = useState(true)

    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState(false)

    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    async function handleChangePassword() {
        setPasswordError("")
        if (newPassword !== confirmPassword) {
            setPasswordError("Les mots de passe ne correspondent pas")
            return
        }
        if (newPassword.length < 6) {
            setPasswordError("Le mot de passe doit faire au moins 6 caractères")
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
            }, 2000)
        } catch (err) {
            setPasswordError("Mot de passe actuel incorrect")
        }
    }

    return (
        <div className="settings-page">

            <header className="topbar">
                <div className="logo">TaskFlow</div>
                <nav className="nav-menu">
                    <div className="nav-item" onClick={() => navigate("/dashboard")}>Dashboard</div>
                    <div className="nav-item" onClick={() => navigate("/objectifs")}>Objectifs</div>
                    <div className="nav-item" onClick={() => navigate("/flow")}>Flow</div>
                    <div className="nav-item" onClick={() => navigate("/profil")}>Profil</div>
                    <div className="nav-item" onClick={() => navigate("/communaute")}>Communauté</div>
                    <div className="nav-item" onClick={() => navigate("/parametres")}>Paramètres</div>
                    <div className="nav-icons">
                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>
                        <div className="nav-avatar">
                            <img src="https://i.pravatar.cc/40" alt="avatar" />
                        </div>
                    </div>
                </nav>
            </header>

            <main className="settings-main">

                <h1 className="settings-title">Paramètres</h1>

                <section className="settings-card">
                    <h2 className="settings-section-title">Apparence</h2>
                    <div className="setting-row">
                        <div>
                            <h3>Dark mode</h3>
                            <p>Activer le thème sombre</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                            <span className="slider"></span>
                        </label>
                    </div>
                </section>

                <section className="settings-card">
                    <h2 className="settings-section-title">Notifications</h2>
                    <div className="setting-row">
                        <div>
                            <h3>Notifications</h3>
                            <p>Recevoir des notifications d'activité</p>
                        </div>
                        <label className="switch">
                            <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                            <span className="slider"></span>
                        </label>
                    </div>
                </section>

                <section className="settings-card">
                    <h2 className="settings-section-title">Compte</h2>

                    <button className="settings-button" onClick={() => navigate("/profil")}>
                        Modifier le profil
                    </button>

                    <button
                        className="settings-button"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                        Changer le mot de passe
                    </button>

                    {showPasswordForm && (
                        <div className="password-form">
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="Mot de passe actuel"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                            />
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="Nouveau mot de passe"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <input
                                className="settings-input"
                                type="password"
                                placeholder="Confirmer le nouveau mot de passe"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                            {passwordError && <p className="password-error">{passwordError}</p>}
                            {passwordSuccess && <p className="password-success">✓ Mot de passe mis à jour !</p>}
                            <button className="main-button" onClick={handleChangePassword}>
                                Confirmer
                            </button>
                        </div>
                    )}

                    <button className="settings-button logout" onClick={handleLogout}>
                        Se déconnecter
                    </button>
                </section>

            </main>

        </div>
    )
}