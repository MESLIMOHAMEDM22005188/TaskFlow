import { useState } from "react"
import "../assets/css/objectifs.css"

type Objectif = {
    id:number
    title:string
    progress:number
}

export default function Objectifs(){

    const [objectifs,setObjectifs] = useState<Objectif[]>([
        {
            id:1,
            title:"Finish backend API",
            progress:70
        },
        {
            id:2,
            title:"Design dashboard UI",
            progress:40
        },
        {
            id:3,
            title:"Launch TaskFlow beta",
            progress:15
        }
    ])

    const updateProgress = (id:number, value:number) => {

        setObjectifs(
            objectifs.map(obj =>
                obj.id === id ? {...obj,progress:value} : obj
            )
        )

    }

    return(

        <div className="objectifs-page">

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
                            <img src="https://i.pravatar.cc/40"/>
                        </div>

                    </div>

                </nav>

            </header>


            <main className="objectifs-main">

                <h1 className="objectifs-title">
                    Goals
                </h1>

                <section className="objectifs-list">

                    {objectifs.map(obj =>(

                        <div key={obj.id} className="objectif-card">

                            <div className="objectif-header">

                                <h3>{obj.title}</h3>

                                <span className="progress-text">
{obj.progress}%
</span>

                            </div>

                            <div className="progress-bar">

                                <div
                                    className="progress-fill"
                                    style={{width: `${obj.progress}%`}}
                                ></div>

                            </div>

                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={obj.progress}
                                onChange={(e)=>updateProgress(obj.id,Number(e.target.value))}
                                className="progress-slider"
                            />

                        </div>

                    ))}

                </section>

            </main>

        </div>

    )

}