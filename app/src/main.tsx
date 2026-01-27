import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";

import { theme } from "./theme.ts";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import { ErrorPage } from "./components/ErrorPage/ErrorPage.tsx";
import { NotFoundPage } from "./components/NotFoundPage/NotFoundPage.tsx";

const router = createRouter({
	routeTree,
	context: {},
	defaultPreload: "intent",
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
	defaultErrorComponent: ErrorPage,
	defaultNotFoundComponent: NotFoundPage,
});

const AppProviders = () => (
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<RouterProvider router={router} />
	</ThemeProvider>
);

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<AppProviders />
		</StrictMode>,
	);
}
