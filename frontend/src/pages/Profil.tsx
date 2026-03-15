import { useState } from "react"
import "../assets/css/profil.css"

export default function Profil(){

    const [username,setUsername] = useState("Sérine")
    const [bio,setBio] = useState("Building TaskFlow 🚀")
    const [email,setEmail] = useState("user@email.com")

    return(

        <div className="profil-page">

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


            <main className="profil-main">

                <h1 className="profil-title">
                    Profile
                </h1>


                <section className="profil-card">

                    <div className="profil-avatar">

                        <img src="https://i.pravatar.cc/120" alt="avatar"/>

                    </div>

                    <div className="profil-form">

                        <label>Username</label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e)=>setUsername(e.target.value)}
                        />

                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                        />

                        <label>Bio</label>

                        <textarea
                            value={bio}
                            onChange={(e)=>setBio(e.target.value)}
                        />

                        <button className="profil-save">
                            Save profile
                        </button>

                    </div>

                </section>


                <section className="profil-stats">

                    <div className="stat-card">

                        <h3>Tasks completed</h3>
                        <p>24</p>

                    </div>

                    <div className="stat-card">

                        <h3>Themes created</h3>
                        <p>6</p>

                    </div>

                    <div className="stat-card">

                        <h3>Community posts</h3>
                        <p>12</p>

                    </div>

                </section>

            </main>

        </div>

    )

}