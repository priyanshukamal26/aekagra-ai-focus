import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "/api";

/**
 * Shared API client with automatic auth header injection.
 * All methods return parsed JSON or throw an error with the server's message.
 */

interface ApiError {
    error: string;
    code?: string;
    details?: Record<string, string[]>;
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    token?: string | null
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("aekagra_token");
            // Only redirect if not already on login page to avoid loops if login check fails
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }
        const data = await res.json().catch(() => ({}));
        const err = data as ApiError;
        throw new Error(err.error || `Request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data as T;
}

/** Create an API instance bound to a specific auth token */
export function createApi(token: string | null) {
    return {
        get: <T>(path: string) => request<T>(path, { method: "GET" }, token),

        post: <T>(path: string, body?: unknown) =>
            request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, token),

        patch: <T>(path: string, body?: unknown) =>
            request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }, token),

        delete: <T>(path: string) => request<T>(path, { method: "DELETE" }, token),
    };
}

/** React hook that returns an API client bound to the current auth token */
export function useApi() {
    const { token } = useAuth();
    return createApi(token);
}
