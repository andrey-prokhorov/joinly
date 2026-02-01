// valideraringsfunktioner för olika dataformat

//validera epost format
export const isValidEmail = (email: string): boolean => {
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9-]{2,}$/;
	return emailRegex.test(email.trim());
};

const SPECIAL_CHARS = /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\;'/~`]/;

//validera lösenord
// minst 8 tecken, minst en stor bokstav, en liten bokstav, en siffra och ett specialtecken
export const isValidPassword = (password: string): boolean => {
	const pwd = password.trim();
	return (
		pwd.length >= 8 &&
		/[A-Z]/.test(pwd) &&
		/[a-z]/.test(pwd) &&
		/[0-9]/.test(pwd) &&
		SPECIAL_CHARS.test(pwd)
	);
};

// Returnera felmeddelande för lösenord (använder samma logik som isValidPassword)
export const getPasswordError = (password: string): string | null => {
	const pwd = password.trim();
	if (pwd.length < 8) return "Lösenord måste vara minst 8 tecken";
	if (!/[A-Z]/.test(pwd)) return "Lösenord måste innehålla stor bokstav";
	if (!/[a-z]/.test(pwd)) return "Lösenord måste innehålla liten bokstav";
	if (!/[0-9]/.test(pwd)) return "Lösenord måste innehålla en siffra";
	if (!SPECIAL_CHARS.test(pwd)) return "Lösenord måste innehålla specialtecken";
	return null;
};
