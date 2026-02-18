// src/services/api.ts

class ApiService {
	private baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"

	private getToken(): string | null {
		return localStorage.getItem("authToken")
	}

	private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
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
			if (
				response.status === 401 &&
				endpoint !== "/auth/login" &&
				endpoint !== "/auth/register" &&
				endpoint !== "/auth/me"
			) {
				this.clearToken()
				window.location.href = "/login?expired=true"
			}
			// Förbered 403-hantering - komponenter kollar response.status för att visa felmeddelande
			if (response.status === 403) {
				console.warn(`Åtkomst nekad: ${endpoint}`)
			}
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
		// return this.request(`/events/${id}`, {
		// 	method: "GET",
		// })
		return new MockEvents().getOneEvent(id);
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

	async getMyEvents(): Promise<Response> {
		// return this.request("/events/my", {
		// 	method: "GET",
		// })
		return new MockEvents().getMyEvents();
	}

	async getEventChatMessages(eventId: string): Promise<Response> {
		// return this.request(`/events/${eventId}/chat`, {
		// 	method: "GET",
		// })
		return new MockEvents().getEventChatMessages(eventId);
	}

	async sendEventChatMessage(eventId: string, message: string): Promise<Response> {
		return this.request(`/events/${eventId}/chat`, {
			method: "POST",
			body: JSON.stringify({ message }),
		})
	}

	async getEventRegistrations(eventId: string): Promise<Response> {
		// return this.request(`/events/${eventId}/registrations`, {
		// 	method: "GET",
		// })
		return new MockEvents().getEventRegistrations(eventId);
	}

	// Helper method to store token
	setToken(token: string): void {
		localStorage.setItem("authToken", token)
	}

	// Helper method to clear token
	clearToken(): void {
		localStorage.removeItem("authToken")
	}

	// Helper method to check if token exists
	hasToken(): boolean {
		return localStorage.getItem("authToken") !== null
	}
}

export const apiService = new ApiService()

class MockEvents {
	async getMyEvents(): Promise<Response> {
		return new Response(JSON.stringify({
			events: [
				{
					id: "1",
					title: "Mock Event",
					city: "Stockholm",
					city_district: null,
					category: "Kultur",
					start_time: "2024-01-01T12:00:00Z",
					end_time: "2024-01-01T14:00:00Z",
					description: "A mock event for testing purposes."
				},
				{
					id: "2",
					title: "Mock Event 2",
					city: "Göteborg",
					city_district: "Centrum",
					category: "Sport",
					start_time: "2024-02-01T15:00:00Z",
					end_time: "2024-02-01T17:00:00Z",
					description: "Another mock event for testing purposes."
				}
			]
		}));
	}
	async getOneEvent(id: string): Promise<Response> {
		return new Response(JSON.stringify({
			id: id,
			title: "Mock Event",
			city: "Stockholm",
			city_district: null,
			category: "Kultur",
			start_time: "2024-01-01T12:00:00Z",
			end_time: "2024-01-01T14:00:00Z",
			description: "A mock event for testing purposes."
		}));
	}

	async getEventChatMessages(eventId: string): Promise<Response> {
		return new Response(JSON.stringify({
			messages: [
				{
					id: "1",
					event_id: eventId,
					user_id: "user1",
					message: "Hej, är det någon som har tips på bra startpunkter för löpsträckorna?",
					created_at: "2024-01-01T10:00:00Z"
				},
				{
					id: "2",
					event_id: eventId,
					user_id: "user2",
					message: "Jag har en bra startpunkt i centrum!",
					created_at: "2024-01-01T11:00:00Z"
				},
				{
					id: "3",
					event_id: eventId,
					user_id: "current-user",
					message: "Jag kan inte komma. Jag har en annan aktivitet samtidigt.",
					created_at: "2024-01-01T12:00:00Z"
				}
			]

		}));
	}

	async getEventRegistrations(eventId: string): Promise<Response> {
		return new Response(JSON.stringify({
			users: [
				{ id: "current-user", name: "Du", email: "user@example.com" },
				{ id: "user1", name: "Anders Andersson", email: "anders@example.com" },
				{ id: "user2", name: "Britta Bergström", email: "britta@example.com" },
				{ id: "user3", name: "Carl Carlsson", email: "carl@example.com" },
				
			]
		}));
	}
}