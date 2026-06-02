import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to normalize base URL (remove trailing slash)
export function getBaseUrl() {
  return (import.meta.env.VITE_BASE_URL as string || '').replace(/\/$/, '');
}
