import { expect, test } from "@playwright/test";
import { login } from "./utils/login";

test.describe("Events för roll: Admin", () => {
	test("Event lista", async ({ page }) => {
		await login(page);

		await page.goto("/events");

		await expect(
			page.getByRole("heading", { name: "List med aktiviteter" }),
		).toBeVisible();

		await expect(page.getByRole("list", { name: "aktiviteter" })).toBeVisible();
	});
});
