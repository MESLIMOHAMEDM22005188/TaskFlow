const API = import.meta.env.VITE_API_URL

function getHeaders() {
    const token = localStorage.getItem("token")
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    }
}

async function handleResponse(res: Response) {
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
    }
    return res.json()
}

// TASKS
export async function getTasks() {
    const res = await fetch(`${API}/api/tasks`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getTodayCompletions(): Promise<number[]> {
    const res = await fetch(`${API}/api/tasks/completions/today`, { headers: getHeaders() })
    return handleResponse(res)
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
    return handleResponse(res)
}

export async function deleteTask(id: number) {
    const res = await fetch(`${API}/api/tasks/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function completeTask(id: number) {
    const res = await fetch(`${API}/api/tasks/${id}/complete`, {
        method: "POST",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function uncompleteTask(id: number) {
    const res = await fetch(`${API}/api/tasks/${id}/complete`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

// THEMES
export async function getThemes() {
    const res = await fetch(`${API}/api/themes`, { headers: getHeaders() })
    return handleResponse(res)
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
    return handleResponse(res)
}

export async function deleteTheme(id: number) {
    const res = await fetch(`${API}/api/themes/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

// PROFIL
export async function getProfil(): Promise<Profil> {
    const res = await fetch(`${API}/api/profil`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function updateProfil(data: { username: string, bio: string }) {
    const res = await fetch(`${API}/api/profil`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

// TYPES
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

export type Profil = {
    id: number
    email: string
    username: string | null
    bio: string | null
    avatar_url: string | null
    stats: {
        tasksCompleted: number
        themesCreated: number
        communityPosts: number
        activityDays: number
        xp: number
        division: string
        top3Count: number
        streak: number
    }
    achievements: Achievement[]
}
export type Achievement = {
    id: number
    name: string
    description: string
    goal: number
    level: number
    type: string
    progress: number
    completed: boolean
}
