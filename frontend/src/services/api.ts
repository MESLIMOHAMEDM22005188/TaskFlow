import axios from "axios";

declare module "axios" {
    interface InternalAxiosRequestConfig {
        metadata?: { startedAt: number };
    }
}

const LOG_PREFIX = "[Grindly:API]";


function normalizeBaseUrl(value: string | undefined): string {
    return (value || "")
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/api$/, "")
}


export const APP_ORIGIN = normalizeBaseUrl(import.meta.env.VITE_API_URL)
export const API_ROOT = APP_ORIGIN ? `${APP_ORIGIN}/api` : "/api"
export const ASSET_ROOT = APP_ORIGIN || ""

console.info(LOG_PREFIX, "Configuration", {
    mode: import.meta.env.MODE,
    appOrigin: APP_ORIGIN || window.location.origin,
    apiRoot: API_ROOT,
    currentPath: window.location.pathname,
    online: navigator.onLine,
});

const api = axios.create({
    baseURL: API_ROOT,
    timeout: 20000,
});

api.interceptors.request.use(
    config => {
        const startedAt = Date.now();
        config.metadata = { startedAt };
        console.debug(LOG_PREFIX, "→ Request", {
            method: config.method?.toUpperCase(),
            url: `${config.baseURL || ""}${config.url || ""}`,
            timeoutMs: config.timeout,
            hasToken: Boolean(localStorage.getItem("token")),
        });
        return config;
    },
    error => {
        console.error(LOG_PREFIX, "Request setup failed", error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    response => {
        const startedAt = response.config.metadata?.startedAt;
        console.debug(LOG_PREFIX, "← Response", {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
            status: response.status,
            durationMs: startedAt ? Date.now() - startedAt : undefined,
        });
        return response;
    },
    error => {
        const config = error?.config;
        console.error(LOG_PREFIX, "← Request failed", {
            method: config?.method?.toUpperCase(),
            url: config?.url,
            status: error?.response?.status ?? "NO_HTTP_RESPONSE",
            durationMs: config?.metadata?.startedAt ? Date.now() - config.metadata.startedAt : undefined,
            message: error?.message,
            response: error?.response?.data,
            online: navigator.onLine,
        });

        if (error?.response?.status === 401) {
            console.warn(LOG_PREFIX, "401: session token will be cleared");
            localStorage.removeItem("token");

            const publicPaths = ["/", "/login", "/signup"];
            if (!publicPaths.includes(window.location.pathname)) {
                console.warn(LOG_PREFIX, "Redirecting to /login from", window.location.pathname);
                window.location.replace("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
