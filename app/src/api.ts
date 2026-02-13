// src/services/api.ts

class ApiService {
    private baseUrl = "http://localhost:3001/api"

    private getToken(): string | null {
        return localStorage.getItem("authToken")
    }

    private async request(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<Response> {
        const url = `${this.baseUrl}${endpoint}`

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        }

        // Add JWT token to Authorization header if it exists
        const token = this.getToken()
        if (token) {
            headers.Authorization = `Bearer ${token}`
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: "include",
            })

            return response
        } catch (error) {
            console.error(`API Error at ${endpoint}:`, error)
            throw error
        }
    }

    // Auth endpoints
    async login(email: string, password: string): Promise<Response> {
        return this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        })
    }

    async register(email: string, password: string, name: string): Promise<Response> {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, password, name }),
        })
    }

    async getMe(): Promise<Response> {
        return this.request("/auth/me", {
            method: "GET",
        })
    }

    async logout(): Promise<Response> {
        return this.request("/auth/logout", {
            method: "POST",
        })
    }

    // Events endpoints
    async getEvents(): Promise<Response> {
        return this.request("/events", {
            method: "GET",
        })
    }

    async createEvent(eventData: unknown): Promise<Response> {
        return this.request("/events", {
            method: "POST",
            body: JSON.stringify(eventData),
        })
    }

    async getEvent(id: string): Promise<Response> {
        return this.request(`/events/${id}`, {
            method: "GET",
        })
    }

    async updateEvent(id: string, eventData: unknown): Promise<Response> {
        return this.request(`/events/${id}`, {
            method: "PUT",
            body: JSON.stringify(eventData),
        })
    }

    async deleteEvent(id: string): Promise<Response> {
        return this.request(`/events/${id}`, {
            method: "DELETE",
        })
    }

    // Users endpoints
    async getUser(id: string): Promise<Response> {
        return this.request(`/users/${id}`, {
            method: "GET",
        })
    }

    async updateUser(id: string, userData: unknown): Promise<Response> {
        return this.request(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(userData),
        })
    }

    async getUsers(): Promise<Response> {
        return this.request("/users", {
            method: "GET",
        })
    }

    // Helper method to store token
    setToken(token: string): void {
        localStorage.setItem("authToken", token)
    }

    // Helper method to clear token
    clearToken(): void {
        localStorage.removeItem("authToken")
    }
}

export const apiService = new ApiService()