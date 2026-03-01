import { expect, test } from "@playwright/test";
import { login } from "./utils/login";

test.describe("Startsida för roll: Admin", () => {
	test("Startsida", async ({ page }) => {
		await login(page);

		await page.goto("/start");

		await expect(
			page.getByRole("heading", { name: "Välkommen till joinly" }),
		).toBeVisible();
	});
});
