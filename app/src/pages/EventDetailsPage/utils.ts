// Utility functions for EventDetailsPage

/**
 * Generate a random color for user avatars from predefined list
 * @returns A random color string
 */
export const generateRandomChatColor = (): string => {
	const colors = [
		"primary.main",
		"secondary.dark",
		"secondary.main",
		"#BBC863",
		"#658C58",
		"#31694E",
	];
	const randomIndex = Math.floor(Math.random() * colors.length);
	return colors[randomIndex];
};

export const generateRandomColor = (): string => {
	const hue = Math.floor(Math.random() * 360);
	const saturation = Math.floor(Math.random() * 30) + 70; // 70-100%
	const lightness = Math.floor(Math.random() * 20) + 50; // 50-70%
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Create a user info map with colors and names for participants
 * @param participants Array of event participants
 * @returns Record mapping user IDs to their info (color, name)
 */
export const createUserInfoMap = (
	participants: Array<{ id: string; name: string }>,
): Record<string, { color: string; name: string }> => {
	const infoMap: Record<string, { color: string; name: string }> = {};
	participants.forEach((user) => {
		infoMap[user.id] = {
			color: generateRandomChatColor(),
			name: user.name,
		};
	});
	return infoMap;
};
