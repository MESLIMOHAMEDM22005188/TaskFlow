import api from "./api"

export type Task = {
    id:number
    title:string
    priority:string
}

export async function createTask(data:{title:string,priority:string}) {
    const res = await api.post("/tasks", data)
    return res.data.task
}

export async function getTasks():Promise<Task[]> {
    const res = await api.get("/tasks")
    return res.data.tasks
}