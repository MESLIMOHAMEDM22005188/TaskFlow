import { useState } from "react"
import { createTask } from "../services/taskService"

export default function CreateTask({reload}:{reload:()=>void}){

    const [title,setTitle] = useState("")

    async function handleCreate(){

        if(!title.trim()) return

        createTask({ title, priority: "medium" })
        setTitle("")
        reload()
    }

    return(

        <div className="task-create">

            <input
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
                placeholder="New task..."
            />

            <button onClick={handleCreate}>
                Create
            </button>

        </div>

    )
}