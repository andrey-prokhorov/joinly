// src/useAuth.ts

import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { apiService } from "@/api";

interface User {
	id: string;
	email: string;
	name: string;
	role: string;
}

interface UseAuthReturn {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	logout: () => Promise<void>;
	checkAuth: (force?: boolean) => Promise<void>;
}

// Cache to prevent too frequent API calls
let authCache: {
	user: User | null;
	tokenExpiry: number | null;
	isLoading: boolean;
} = {
	user: null,
	tokenExpiry: null,
	isLoading: false,
};

// Decode JWT token to get expiration time
const getTokenExpiry = (token: string): number | null => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
	} catch (error) {
		console.warn("Failed to decode token:", error);
		return null;
	}
};

export const useAuth = (): UseAuthReturn => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const navigate = useNavigate();

	const checkAuth = useCallback(async (force = false) => {
		const now = Date.now();
		const token = apiService.hasToken()
			? localStorage.getItem("authToken")
			: null;

		// Check if we have cached data and valid token
		if (!force && authCache.user && token && authCache.tokenExpiry) {
			const isTokenValid = now < authCache.tokenExpiry;

			if (isTokenValid && !authCache.isLoading) {
				setUser(authCache.user);
				setIsLoading(false);
				return;
			}
		}

		// If another request is in-flight, wait for it to complete
		if (authCache.isLoading) {
			// Poll until the other request completes
			while (authCache.isLoading) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
			// Update state from cache once the request is done
			setUser(authCache.user);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		authCache.isLoading = true;

		try {
			if (!token) {
				const userData = null;
				setUser(userData);
				authCache.user = userData;
				authCache.tokenExpiry = null;
				setIsLoading(false);
				authCache.isLoading = false;
				return;
			}

			const response = await apiService.getMe();
			if (response.ok) {
				const data = await response.json();
				const userData = data.user;
				const tokenExpiry = getTokenExpiry(token);

				setUser(userData);
				authCache.user = userData;
				authCache.tokenExpiry = tokenExpiry;
			} else {
				const userData = null;
				setUser(userData);
				authCache.user = userData;
				authCache.tokenExpiry = null;
				apiService.clearToken();
			}
		} catch (error) {
			console.error("Auth check failed:", error);
			const userData = null;
			setUser(userData);
			authCache.user = userData;
			authCache.tokenExpiry = null;
			apiService.clearToken();
		} finally {
			setIsLoading(false);
			authCache.isLoading = false;
		}
	}, []);

	const logout = async () => {
		try {
			await apiService.logout();
			setUser(null);
			apiService.clearToken();

			// Clear auth cache on logout
			authCache = {
				user: null,
				tokenExpiry: null,
				isLoading: false,
			};

			navigate({ to: "/start" });
		} catch (error) {
			console.error("Logout failed:", error);
			apiService.clearToken();

			// Clear auth cache on logout error too
			authCache = {
				user: null,
				tokenExpiry: null,
				isLoading: false,
			};

			navigate({ to: "/start" });
		}
	};

	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	return {
		user,
		isLoading,
		isAuthenticated: user !== null,
		logout,
		checkAuth,
	};
};
