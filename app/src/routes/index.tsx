import { createFileRoute } from "@tanstack/react-router"
import { StartPage } from "@/pages/StartPage/StartPage"

const App = () => {
	return <StartPage />
}

export const Route = createFileRoute("/")({
	component: App,
})
