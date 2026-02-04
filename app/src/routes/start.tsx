import { createFileRoute } from "@tanstack/react-router"
import { StartPage } from "@/pages/StartPage/StartPage"

const Start = () => {
	return <StartPage />
}

export const Route = createFileRoute("/start")({
	component: Start,
})
