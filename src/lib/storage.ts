export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silently ignore quota errors
  }
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

export const KEYS = {
  variant: "cnn-lab/variant",
  submission: "cnn-lab/submission",
} as const;
