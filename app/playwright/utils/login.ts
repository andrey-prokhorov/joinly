import { expect, type Page } from "@playwright/test"


export const login = async (page: Page) => {
    const loginUrl = "/login"
    const username = process.env.E2E_TEST_USERNAME as string
	const password = process.env.E2E_TEST_PASSWORD as string

	await page.goto(loginUrl)
    await page.getByLabel('Epost').fill(username);
    await page.getByLabel('Lösenord').fill(password);

	await Promise.all([
		await page.getByRole('button', { name: 'Logga in' }).click(),
		page.waitForLoadState("networkidle").catch(() => {}),
	])
}
