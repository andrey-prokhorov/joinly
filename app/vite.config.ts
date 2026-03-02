import { resolve } from "node:path";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [viteReact()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/cypress/**",
			"**/.{idea,git,cache,output,temp}/**",
			"**/playwright/**", // Exclude Playwright tests from Vitest
		],
	},
});
