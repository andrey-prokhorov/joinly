import { expect, test } from "@playwright/test";
import { login } from "./utils/login";

test.describe("Event detaljsida för roll: Admin", () => {
	test("Event detaljsida", async ({ page }) => {
		await login(page);

		await page.goto("/events");

		await expect(page.getByText("Högdalen Running Club Event")).toBeVisible();

		await page.getByText("Högdalen Running Club Event").click();

		await expect(
			page.getByRole("heading", { name: "Högdalen Running Club Event" }),
		).toBeVisible();

		await expect(page.getByRole("button", { name: "Anmäl mig" })).toBeVisible();
	});
});
