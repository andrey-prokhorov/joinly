import { createFileRoute } from "@tanstack/react-router"
import { RegisterPage } from "@/pages/RegisterPage/RegisterPage"

const Register = () => {
    return <RegisterPage />
}

export const Route = createFileRoute("/register")({
    component: Register,
})
