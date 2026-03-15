import { useState } from "react"
import "../assets/css/parametres.css"

export default function Parametres(){

    const [notifications,setNotifications] = useState(true)
    const [darkMode,setDarkMode] = useState(true)

    return(

        <div className="settings-page">

            <header className="topbar">

                <div className="logo">
                    TaskFlow
                </div>

                <nav className="nav-menu">

                    <div className="nav-item">Dashboard</div>
                    <div className="nav-item">Objectifs</div>
                    <div className="nav-item">Flow</div>
                    <div className="nav-item">Profil</div>
                    <div className="nav-item">Communauté</div>
                    <div className="nav-item">Paramètres</div>

                    <div className="nav-icons">

                        <div className="nav-item nav-search">🔍</div>

                        <div className="nav-item nav-notif">🔔</div>

                        <div className="nav-avatar">
                            <img src="https://i.pravatar.cc/40" alt="avatar"/>
                        </div>

                    </div>

                </nav>

            </header>


            <main className="settings-main">

                <h1 className="settings-title">
                    Settings
                </h1>


                <section className="settings-card">

                    <div className="setting-row">

                        <div>
                            <h3>Dark mode</h3>
                            <p>Enable dark interface theme</p>
                        </div>

                        <label className="switch">

                            <input
                                type="checkbox"
                                checked={darkMode}
                                onChange={()=>setDarkMode(!darkMode)}
                            />

                            <span className="slider"></span>

                        </label>

                    </div>


                    <div className="setting-row">

                        <div>
                            <h3>Notifications</h3>
                            <p>Receive activity notifications</p>
                        </div>

                        <label className="switch">

                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={()=>setNotifications(!notifications)}
                            />

                            <span className="slider"></span>

                        </label>

                    </div>

                </section>


                <section className="settings-card">

                    <h3>Account</h3>

                    <button className="settings-button">
                        Change password
                    </button>

                    <button className="settings-button logout">
                        Logout
                    </button>

                </section>

            </main>

        </div>

    )
}