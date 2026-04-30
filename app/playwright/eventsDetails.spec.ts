import { expect, test } from "@playwright/test";
import { login } from "./utils/login";

test.describe("Event detaljsida för roll: Admin", () => {
	test("Event detaljsida", async ({ page }) => {
		await login(page);

		await page.goto("/events");

		const eventsList = page.getByRole("list", { name: "aktiviteter" });
		await expect(eventsList).toBeVisible();

		// Klicka på första eventet i listan, oavsett vilket det är
		const firstEvent = eventsList.getByRole("listitem").first();
		await firstEvent.click();

		// Vänta på att URL ändras till detaljsidan
		await page.waitForURL("**/events-detail/**", { timeout: 10000 });

		// Verifiera att detaljsidans innehåll laddas (event-titel som h4)
		await expect(page.getByRole("heading", { level: 4 })).toBeVisible();
	});
});
