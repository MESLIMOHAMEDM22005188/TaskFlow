import axios from "axios";

function normalizeBaseUrl(value: string | undefined): string {
    return (value || "")
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/api$/, "")
}

export const APP_ORIGIN = normalizeBaseUrl(import.meta.env.VITE_API_URL)
export const API_ROOT = APP_ORIGIN ? `${APP_ORIGIN}/api` : "/api"
export const ASSET_ROOT = APP_ORIGIN || ""

const api = axios.create({
    baseURL: API_ROOT
});

// Clear rejected sessions and redirect private pages to login.
api.interceptors.response.use(
    response => response,
    error => {
        if (error?.response?.status === 401) {
            localStorage.removeItem("token")

            const publicPaths = ["/", "/login", "/signup"]
            if (!publicPaths.includes(window.location.pathname)) {
                window.location.replace("/login")
            }
        }

        return Promise.reject(error)
    }
)

export default api;
