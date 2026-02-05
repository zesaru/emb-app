/**
 * Generates consistent avatar colors based on user name
 * Uses a hash function to create unique but consistent colors
 */

const avatarGradients = [
  { from: '#3b82f6', to: '#8b5cf6' }, // Blue to Purple
  { from: '#06b6d4', to: '#3b82f6' }, // Cyan to Blue
  { from: '#8b5cf6', to: '#ec4899' }, // Purple to Pink
  { from: '#f59e0b', to: '#ef4444' }, // Amber to Red
  { from: '#10b981', to: '#06b6d4' }, // Emerald to Cyan
  { from: '#f97316', to: '#f59e0b' }, // Orange to Amber
  { from: '#6366f1', to: '#8b5cf6' }, // Indigo to Purple
  { from: '#14b8a6', to: '#10b981' }, // Teal to Emerald
];

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get avatar gradient colors based on user name
 */
export function getAvatarGradient(name: string) {
  if (!name) {
    return avatarGradients[0];
  }

  const hash = hashString(name);
  const index = hash % avatarGradients.length;
  return avatarGradients[index];
}

/**
 * Get avatar initials with consistent styling
 */
export function getAvatarInitials(name: string): string {
  if (!name) return 'U';

  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}
