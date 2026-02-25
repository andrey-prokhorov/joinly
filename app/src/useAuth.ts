// src/useAuth.ts

import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"
import { apiService } from "@/api"

interface User {
	id: string
	email: string
	name: string
	role: string
}

interface UseAuthReturn {
	user: User | null
	isLoading: boolean
	isAuthenticated: boolean
	logout: () => Promise<void>
	checkAuth: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const navigate = useNavigate()

	const checkAuth = useCallback(async () => {
		setIsLoading(true)

		try {
			const tokenExists = apiService.hasToken()

			if (!tokenExists) {
				setIsLoading(false)
				return
			}

			const response = await apiService.getMe()
			if (response.ok) {
				const data = await response.json()
				setUser(data.user)
			} else {
				setUser(null)
				apiService.clearToken()
			}
		} catch (error) {
			console.error("Auth check failed:", error)
			setUser(null)
			apiService.clearToken()
		} finally {
			setIsLoading(false)
		}
	}, [])

	const logout = async () => {
		try {
			await apiService.logout()
			setUser(null)
			apiService.clearToken()
			navigate({ to: "/start" })
		} catch (error) {
			console.error("Logout failed:", error)
			apiService.clearToken()
			navigate({ to: "/start" })
		}
	}

	useEffect(() => {
		checkAuth()
	}, [checkAuth])

	return {
		user,
		isLoading,
		isAuthenticated: user !== null,
		logout,
		checkAuth,
	}
}
