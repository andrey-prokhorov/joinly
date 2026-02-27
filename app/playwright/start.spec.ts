import { test, expect } from '@playwright/test';
import { login } from "./utils/login"

test.describe("Startsida: Admin", () => {
	test("Startsida", async ({ page }) => {
		await login(page)
		await expect(page.getByRole("heading", { name: "List med aktiviteter" })).toBeVisible()

	})
})

