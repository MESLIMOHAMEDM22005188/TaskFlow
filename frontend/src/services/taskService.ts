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

export async function getTodayCompletions(): Promise<TaskDailyState[]> {
    const res = await fetch(`${API}/api/tasks/completions/today`, {
        headers: getHeaders()
    })
    return handleResponse(res)
}
export async function createTask(data: {
    title: string
    priority: string
    theme_id?: number | null
    frequency?: string
    deadline?: string | null
    note?: string | null
    completion_target?:  number
}) {
    const res = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

export async function deleteTask(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API}/api/tasks/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function getTaskHistory(): Promise<TaskHistory[]> {
    const res = await fetch(`${API}/api/tasks/history`, {
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function completeTask(id: number): Promise<{ task: Task, xp: number }> {
    const res = await fetch(`${API}/api/tasks/${id}/complete`, {
        method: "POST",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function uncompleteTask(id: number): Promise<{ task: Task, xp: number }> {
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
    user_id: number
    title: string
    priority: string
    frequency: string
    theme_id: number | null
    deadline: string | null
    note: string | null
    completion_target: number
    completions_count: number
    status: "active" | "done" | "archived"
    completed_at: string | null
    archived_at: string | null
    created_at: string

    // champs joints depuis le GET /
    today_count: number
    done_today: boolean
    theme_name: string | null
    theme_emoji: string | null
    theme_color: string | null
}
export async function joinGroup(groupId: number): Promise<{ joined: boolean }> {
    const res = await fetch(`${API}/api/community/groups/${groupId}/join`, {
        method: "POST",
        headers: getHeaders(),
    })
    return handleResponse(res)
}

export type TaskDailyState = {
    task_id: number
    today_count: number
    done_today: boolean
}

export type TaskHistory = {
    id: number
    title: string
    status: "done" | "archived"
    priority: string
    frequency: string
    completion_target: number
    completions_count: number
    total_completions: number
    lifespan_days: number
    created_at: string
    completed_at: string | null
    archived_at: string | null
    theme_name: string | null
    theme_emoji: string | null
    theme_color: string | null
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

// TYPES
export type FlowSettings = {
    id: number
    user_id: number
    focus_duration: number
    short_break: number
    long_break: number
    pomodoros_until_long: number
    auto_start_break: boolean
    ambient_sound: string
    ambient_volume: number
}

export type FlowStats = {
    todaySessions: number
    todayMinutes: number
    totalSessions: number
    totalMinutes: number
}

export type FlowSession = {
    id: number
    task_id: number | null
    duration_minutes: number
    type: string
    completed: boolean
    xp_gained: number
}

// FUNCTIONS
export async function getFlowSettings(): Promise<FlowSettings> {
    const res = await fetch(`${API}/api/flow/settings`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function updateFlowSettings(data: Partial<FlowSettings>) {
    const res = await fetch(`${API}/api/flow/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

export async function saveFlowSession(data: {
    task_id?: number | null
    duration_minutes: number
    type: string
    completed: boolean
}) {
    const res = await fetch(`${API}/api/flow/sessions`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}
export async function changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API}/api/auth/change-password`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
    })
    return handleResponse(res)
}


export async function getFlowStats(): Promise<FlowStats> {
    const res = await fetch(`${API}/api/flow/stats`, { headers: getHeaders() })
    return handleResponse(res)
}

export type Post = {
    id: number
    content: string
    type: string
    likes_count: number
    comments_count: number
    liked_by_me: number
    created_at: string
    username: string
    avatar_url: string | null
    xp: number
    // nouveaux champs
    group_id: number | null
    is_anonymous: boolean
    anon_name: string | null
}

export type Comment = {
    id: number
    post_id: number
    content: string
    created_at: string
    username: string
    avatar_url: string | null
    is_anonymous: boolean
    anon_name: string | null
}
export type LeaderboardUser = {
    id: number
    username: string
    avatar_url: string | null
    xp: number
    tasks_this_week: number
}

// FUNCTIONS
export async function getPosts(groupId?: number): Promise<Post[]> {
    const url = groupId
        ? `${API}/api/community/posts?group_id=${groupId}`
        : `${API}/api/community/posts`
    const res = await fetch(url, { headers: getHeaders() })
    return handleResponse(res)
}


export async function getAnonymousPosts(): Promise<Post[]> {
    const res = await fetch(`${API}/api/community/posts/anonymous`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function createPost(data: {
    content: string
    type?: string
    ref_id?: number
    group_id?: number
    is_anonymous?: boolean
}) {
    const res = await fetch(`${API}/api/community/posts`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

export async function deletePost(id: number) {
    const res = await fetch(`${API}/api/community/posts/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function likePost(id: number) {
    const res = await fetch(`${API}/api/community/posts/${id}/like`, {
        method: "POST",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function getComments(postId: number): Promise<Comment[]> {
    const res = await fetch(`${API}/api/community/posts/${postId}/comments`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function createComment(
    postId: number,
    content: string,
    is_anonymous = false
): Promise<Comment> {
    const res = await fetch(`${API}/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ content, is_anonymous }),
    })
    return handleResponse(res)
}
export async function getLeaderboard(groupId?: number): Promise<LeaderboardUser[]> {
    const url = groupId
        ? `${API}/api/community/leaderboard?group_id=${groupId}`
        : `${API}/api/community/leaderboard`
    const res = await fetch(url, { headers: getHeaders() })
    return handleResponse(res)
}
export async function uploadAvatar(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("avatar", file)

    const token = localStorage.getItem("token")
    const res = await fetch(`${API}/api/upload/avatar`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    })
    const data = await handleResponse(res)
    return data.avatar_url
}
// TYPES
export type StatsOverview = {
    totalTasks: number
    totalXp: number
    totalFocus: number
    bestStreak: number
    bestDay: string
    bestHour: number | null
}
export type Group = {
    id: number
    name: string
    description: string | null
    emoji: string
    category: string
    is_private: boolean
    created_by: number
    created_at: string
    member_count: number
    post_count: number
    is_member: number
}

export type TaskPerDay = {
    date: string
    count: number
}

export type XpOverTime = {
    period: string
    xp: number
}

export type RadarData = {
    theme: string
    color: string
    emoji: string
    tasks: number
    completed: number
}

export type PrioritySplit = {
    priority: string
    count: number
}

export type FocusPerDay = {
    date: string
    minutes: number
}

// FUNCTIONS
export async function getStatsOverview(): Promise<StatsOverview> {
    const res = await fetch(`${API}/api/stats/overview`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getTasksPerDay(period: "week" | "month" | "year"): Promise<TaskPerDay[]> {
    const res = await fetch(`${API}/api/stats/tasks-per-day?period=${period}`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getXpOverTime(period: "week" | "month" | "year"): Promise<XpOverTime[]> {
    const res = await fetch(`${API}/api/stats/xp-over-time?period=${period}`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getRadarData(): Promise<RadarData[]> {
    const res = await fetch(`${API}/api/stats/radar`, { headers: getHeaders() })
    return handleResponse(res)
}// ── À ajouter dans taskService.ts ─────────────────────────────

export type UserPreferences = {
    accent_color: string
    bg_preset: string
    dark_mode: boolean
    compact_mode: boolean
    reduced_motion: boolean
    language: string
    notif_habits: boolean
    notif_milestones: boolean
    notif_community_likes: boolean
    notif_community_comments: boolean
    notif_flow_reminders: boolean
    notif_weekly_recap: boolean
    notif_relapse_support: boolean
    privacy_profile_public: boolean
    privacy_show_xp: boolean
    privacy_show_streaks: boolean
    privacy_appear_leaderboard: boolean
    privacy_default_posts_private: boolean
    privacy_default_habits_private: boolean
}

export async function getPreferences(): Promise<UserPreferences> {
    const res = await fetch(`${API}/api/preferences`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function savePreferences(data: Partial<UserPreferences>): Promise<void> {
    const res = await fetch(`${API}/api/preferences`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse(res)
}

export async function getPrioritySplit(): Promise<PrioritySplit[]> {
    const res = await fetch(`${API}/api/stats/priority-split`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getFocusPerDay(period: "week" | "month" | "year"): Promise<FocusPerDay[]> {
    const res = await fetch(`${API}/api/stats/focus-per-day?period=${period}`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getHeatmap(): Promise<TaskPerDay[]> {
    const res = await fetch(`${API}/api/stats/heatmap`, { headers: getHeaders() })
    return handleResponse(res)
}// TYPES
export type Habit = {
    id: number
    user_id: number
    name: string
    type: "build" | "quit"
    category: string
    emoji: string | null
    color: string
    frequency: string
    difficulty: string
    reminder_time: string | null
    is_private: boolean
    motivation: string | null
    triggers: string | null
    relapse_plan: string | null
    danger_level: string
    is_active: boolean
    created_at: string
    times_per_day: number       // ✅ times pas time
    start_date: string | null
    streak: number
    bestStreak: number
    doneToday: boolean
    todayCount: number          // ✅ ajouté
    relapseCount: number
    lastRelapse: string | null
    totalSuccess: number
    sparkCount: number          // ✅ ajouté
    hadSparkYesterday: boolean  // ✅ ajouté
}

export type HabitLog = {
    date: string
    type: "success" | "relapse"
}

export async function getNotifications() {
    const res = await fetch(`${API}/api/notifications`, { headers: getHeaders() })
    return handleResponse(res)
}

export type HabitMilestone = {
    id: number
    days: number
    reached_at: string
}

// FUNCTIONS
export async function getHabits(): Promise<Habit[]> {
    const res = await fetch(`${API}/api/habits`, { headers: getHeaders() })
    return handleResponse(res)
}
export async function getGroups(): Promise<Group[]> {
    const res = await fetch(`${API}/api/community/groups`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function createGroup(data: {
    name: string
    description?: string
    emoji?: string
    category?: string
    is_private?: boolean
}): Promise<Group> {
    const res = await fetch(`${API}/api/community/groups`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    })
    return handleResponse(res)
}
export async function createHabit(data: {
    name: string
    type: string
    category: string
    emoji?: string
    color?: string
    frequency?: string
    difficulty?: string
    reminder_time?: string
    is_private?: boolean
    motivation?: string
    triggers?: string
    relapse_plan?: string
    danger_level?: string
    times_per_day?: number
    start_date?: string
}) {
    const res = await fetch(`${API}/api/habits`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

export async function updateHabit(id: number, data: Partial<Habit>) {
    const res = await fetch(`${API}/api/habits/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data)
    })
    return handleResponse(res)
}

export async function deleteHabit(id: number) {
    const res = await fetch(`${API}/api/habits/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function logHabitSuccess(id: number, note?: string): Promise<{
    xpGained: number
    isSpark: boolean
    todayCount: number
    isFullDay: boolean
}> {
    const res = await fetch(`${API}/api/habits/${id}/success`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ note })
    })
    return handleResponse(res)
}

export async function logHabitRelapse(id: number, note?: string) {
    const res = await fetch(`${API}/api/habits/${id}/relapse`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ note })
    })
    return handleResponse(res)
}

export async function undoHabitSuccess(id: number) {
    const res = await fetch(`${API}/api/habits/${id}/success`, {
        method: "DELETE",
        headers: getHeaders()
    })
    return handleResponse(res)
}

export async function getHabitHeatmap(id: number): Promise<HabitLog[]> {
    const res = await fetch(`${API}/api/habits/${id}/heatmap`, { headers: getHeaders() })
    return handleResponse(res)
}

export async function getHabitMilestones(id: number): Promise<HabitMilestone[]> {
    const res = await fetch(`${API}/api/habits/${id}/milestones`, { headers: getHeaders() })
    return handleResponse(res)
}