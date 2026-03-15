import { useState } from "react"
import "../assets/css/dashboard.css"



type Task = {
    id:number
    title:string
    priority:string
}

type Theme = {
    id:number
    name:string
    tasks:number
}

export default function Dashboard(){

    const [dark,setDark] = useState(true)

    const themes:Theme[] = [
        { id:1,name:"Frontend",tasks:5 },
        { id:2,name:"Backend",tasks:3 },
        { id:3,name:"DevOps",tasks:2 }
    ]

    const [tasks] = useState<Task[]>([
        { id:1,title:"Finish API authentication",priority:"Medium"},
        { id:2,title:"Create signup page",priority:"Easy"}
    ])

    return(

        <div className={dark ? "dashboard dark" : "dashboard light"}>

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

                        <button
                            className="theme-button"
                            onClick={()=>setDark(!dark)}
                        >
                            {dark ? "Light mode" : "Dark mode"}
                        </button>

                    </div>

                </nav>

            </header>


            <main className="main">

                <h1 className="title">
                    Your workspace
                </h1>


                <div className="action-center">

                    <button className="main-button">
                        Create Theme
                    </button>

                    <button className="main-button">
                        Create Task
                    </button>

                </div>


                <section className="themes">

                    {themes.map(theme =>(

                        <div key={theme.id} className="theme-card">

                            <div className="theme-name">
                                {theme.name}
                            </div>

                            <div className="theme-count">
                                {theme.tasks} tasks
                            </div>

                        </div>

                    ))}

                </section>


                <section className="tasks">

                    <h2 className="section-title">
                        Tasks
                    </h2>

                    <div className="task-list">

                        {tasks.map(task =>(

                            <div key={task.id} className="task">

                                <div className="task-left">

                                    <div className="check"></div>

                                    <span>{task.title}</span>

                                </div>

                                <div className="priority">
                                    {task.priority}
                                </div>

                            </div>

                        ))}

                    </div>

                </section>

            </main>

        </div>

    )
}