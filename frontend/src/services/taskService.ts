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

// TYPES
export type ObjectiveTemplate = {
    id: number
    title: string
    description: string
    category: string
    emoji: string
    suggested_days: number | null
    target_value: number | null
    target_unit: string | null
}

export type Objective = {
    id: number
    user_id: number
    template_id: number | null
    title: string
    description: string | null
    emoji: string | null
    theme_id: number | null
    target_value: number | null
    current_value: number
    target_unit: string | null
    deadline: string | null
    status: "active" | "completed" | "abandoned"
    created_at: string
}

// FUNCTIONS
export async function getObjectives(): Promise<Objective[]> {
    const res = await fetch(`${API}/api/objectives`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getObjectiveTemplates(): Promise<ObjectiveTemplate[]> {
    const res = await fetch(`${API}/api/objectives/templates`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function createObjective(data: {
    title: string
    description?: string
    emoji?: string
    theme_id?: number | null
    target_value?: number | null
    target_unit?: string
    deadline?: string | null
}) {
    const res = await fetch(`${API}/api/objectives`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

export async function adoptTemplate(templateId: number, deadline?: string) {
    const res = await fetch(`${API}/api/objectives/adopt/${templateId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ deadline })
    })
    return handleResponse(res)
}

export async function updateObjectiveProgress(id: number, current_value: number) {
    const res = await fetch(`${API}/api/objectives/${id}/progress`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ current_value })
    })
    return handleResponse(res)
}

export async function updateObjectiveStatus(id: number, status: string) {
    const res = await fetch(`${API}/api/objectives/${id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status })
    })
    return handleResponse(res)
}

export async function deleteObjective(id: number) {
    const res = await fetch(`${API}/api/objectives/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}
