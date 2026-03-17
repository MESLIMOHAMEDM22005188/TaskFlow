const API = import.meta.env.VITE_API_URL

function getHeaders() {
    const token = localStorage.getItem("token")
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    }
}

// TASKS
export async function getTasks() {
    const res = await fetch(`${API}/api/tasks`, { headers: getHeaders() })
    return res.json()
}

export async function createTask(data: {
    title: string
    priority: string
    theme_id?: number | null
    frequency?: string
    deadline?: string | null
    note?: string | null
}) {
    const res = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return res.json()
}

export async function deleteTask(id: number) {
    await fetch(`${API}/api/tasks/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
}

export async function completeTask(id: number) {
    const res = await fetch(`${API}/api/tasks/${id}/complete`, {
        method: "POST",
        headers: getHeaders()
    })
    return res.json()
}

export async function uncompleteTask(id: number) {
    await fetch(`${API}/api/tasks/${id}/complete`, {
        method: "DELETE",
        headers: getHeaders()
    })
}

// THEMES
export async function getThemes() {
    const res = await fetch(`${API}/api/themes`, { headers: getHeaders() })
    return res.json()
}

export async function createTheme(data: {
    name: string
    emoji?: string
    color?: string
}) {
    const res = await fetch(`${API}/api/themes`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return res.json()
}

export async function deleteTheme(id: number) {
    await fetch(`${API}/api/themes/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
}

export type Task = {
    id: number
    title: string
    priority: string
    frequency: string
    theme_id: number | null
    deadline: string | null
    note: string | null
}

export type Theme = {
    id: number
    name: string
    emoji: string | null
    color: string
}