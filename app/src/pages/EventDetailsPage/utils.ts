// Utility functions for EventDetailsPage

/**
 * Generate a random HSL color for user avatars
 * @returns A random HSL color string
 */
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
			color: generateRandomColor(),
			name: user.name,
		};
	});
	return infoMap;
};
