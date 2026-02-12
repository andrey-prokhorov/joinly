import { createFileRoute } from "@tanstack/react-router"
import { LoginPage } from "@/pages/LoginPage/LoginPage"

const Login = () => {
    return <LoginPage />
}

export const Route = createFileRoute("/login")({
    component: Login,
})
