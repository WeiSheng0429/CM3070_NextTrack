// Shared utility functions used across multiple components.

export function placeholderColor(seed: string): string {
  const colors = ["#7c3333", "#7c6a33", "#2d6e4a", "#2d4e7c", "#5a2d7c", "#7c2d6a"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const API_BASE_URL = "http://localhost:5000";
