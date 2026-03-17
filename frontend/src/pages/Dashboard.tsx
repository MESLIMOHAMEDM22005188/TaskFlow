import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../assets/css/dashboard.css"
import { createTask, getTasks } from "../services/taskService"
import type { Task } from "../services/taskService"

type Theme = {
    id:number
    name:string
    tasks:number
}

export function Dashboard() {

    const navigate = useNavigate()

    const [dark, setDark] = useState(true)

    const themes: Theme[] = [
        {id: 1, name: "Frontend", tasks: 5},
        {id: 2, name: "Backend", tasks: 3},
        {id: 3, name: "DevOps", tasks: 2}
    ]

    const [tasks, setTasks] = useState<Task[]>([])
    const [newTask, setNewTask] = useState("")
    const [priority, setPriority] = useState("Medium")


    useEffect(() => {

        const fetchTasks = async () => {
            try {
                const data = await getTasks()
                setTasks(data)
            } catch (err) {
                console.error(err)
            }
        }

        fetchTasks()

    }, [])

    async function handleCreateTask() {

        if (!newTask.trim()) return

        try {

            const task = await createTask({
                title: newTask,
                priority
            })

            setTasks([...tasks, task])

            setNewTask("")
            setPriority("Medium")

        } catch (err) {
            console.error(err)
            alert("Failed to create task")
        }

    }

    return (

        <div className={dark ? "dashboard dark" : "dashboard light"}>

            <header className="topbar">

                <div className="logo">
                    TaskFlow
                </div>

                <nav className="nav-menu">

                    <div className="nav-item" onClick={() => navigate("/dashboard")}>
                        Dashboard
                    </div>

                    <div className="nav-item" onClick={() => navigate("/objectifs")}>
                        Objectifs
                    </div>

                    <div className="nav-item" onClick={() => navigate("/flow")}>
                        Flow
                    </div>

                    <div className="nav-item" onClick={() => navigate("/profil")}>
                        Profil
                    </div>

                    <div className="nav-item" onClick={() => navigate("/communaute")}>
                        Communauté
                    </div>

                    <div className="nav-item" onClick={() => navigate("/parametres")}>
                        Paramètres
                    </div>
                    <div className="nav-item nav-focus">
                        ⚡ Focus
                    </div>

                    <div className="nav-icons">

                        <div className="nav-item nav-search">🔍</div>
                        <div className="nav-item nav-notif">🔔</div>

                        <button
                            className="theme-button"
                            onClick={() => setDark(!dark)}
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

                    <input
                        className="task-input"
                        placeholder="Task title..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                    />

                    <select
                        className="task-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>

                    <button
                        className="main-button"
                        onClick={handleCreateTask}
                    >
                        Create Task
                    </button>

                </div>


                <section className="themes">

                    {themes.map(theme => (

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

                        {tasks.map(task => (

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