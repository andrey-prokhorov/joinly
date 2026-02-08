// Valideringsfunktioner för olika dataformat:

// validera epost format
// TLD (top-level domain) får bara innehålla bokstäver, inte siffror eller bindestreck
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
	return emailRegex.test(email.trim())
}

const SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\;'/~`]/

// validera lösenord
// minst 8 tecken, minst en stor bokstav, en liten bokstav, en siffra och ett specialtecken
// OBS: vi trimmar INTE lösenord - whitespace bevaras för konsistens med login
export const isValidPassword = (password: string): boolean => {
	return (
		password.length >= 8 &&
		/[A-Z]/.test(password) &&
		/[a-z]/.test(password) &&
		/[0-9]/.test(password) &&
		SPECIAL_CHARS.test(password)
	)
}

// validera namn - får inte vara tomt eller bara whitespace. Minst 2 tecken, max 50 tecken.
// Trimma whitespace i början och slutet.
export const isValidName = (name: string): boolean => {
	const trimmedName = name.trim()
	return trimmedName.length >= 2 && trimmedName.length <= 50
}

// Hantera felmeddelanden - returnera specifika felmeddelanden för varje validering, eller null om det är giltigt:

// Returnera felmeddelande för epost (använder samma logik som isValidEmail)
export const getEmailError = (email: string): string | null => {
	if (!isValidEmail(email)) return "Ogiltig e-postadress"
	return null
}

// Returnera felmeddelande för lösenord (använder samma logik som isValidPassword)
export const getPasswordError = (password: string): string | null => {
	if (password.length < 8) return "Lösenord måste vara minst 8 tecken"
	if (!/[A-Z]/.test(password)) return "Lösenord måste innehålla stor bokstav"
	if (!/[a-z]/.test(password)) return "Lösenord måste innehålla liten bokstav"
	if (!/[0-9]/.test(password)) return "Lösenord måste innehålla en siffra"
	if (!SPECIAL_CHARS.test(password))
		return "Lösenord måste innehålla specialtecken"
	return null
}

// returnera felmeddelande för namn (använder samma logik som isValidName)
export const getNameError = (name: string): string | null => {
	const trimmedName = name.trim()
	if (trimmedName.length < 2) return "Namn måste vara minst 2 tecken"
	if (trimmedName.length > 50) return "Namn får inte vara längre än 50 tecken"
	return null
}
