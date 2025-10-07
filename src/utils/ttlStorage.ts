// src/utils/ttlStorage.ts
export type TTLItem<T> = { value: T; exp: number }

export function setWithExpiry<T>(key: string, value: T, ttlMs: number) {
  const exp = Date.now() + ttlMs
  localStorage.setItem(key, JSON.stringify({ value, exp } as TTLItem<T>))
}

export function getWithExpiry<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const { value, exp } = JSON.parse(raw) as TTLItem<T>
    if (Date.now() > exp) {
      localStorage.removeItem(key)
      return null
    }
    return value as T
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

export function removeItem(key: string) {
  localStorage.removeItem(key)
}
