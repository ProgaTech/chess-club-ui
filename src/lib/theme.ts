import { useSyncExternalStore } from 'react'

export type ThemeChoice = 'system' | 'light' | 'dark'

// Keep in sync with the inline script in index.html, which sets the class before first paint.
const themeKey = 'chess-club:theme'
const darkQuery = '(prefers-color-scheme: dark)'
const listeners = new Set<() => void>()
let current = storedChoice()

export function themeChoice(): ThemeChoice {
  return current
}

export function setThemeChoice(choice: ThemeChoice): void {
  current = choice
  try {
    if (choice === 'system') {
      localStorage.removeItem(themeKey)
    } else {
      localStorage.setItem(themeKey, choice)
    }
  } catch {
    // Storage is blocked. The choice lasts until reload.
  }
  applyTheme()
}

export function isDarkTheme(): boolean {
  return document.documentElement.classList.contains('dark')
}

// Follows the system setting live while the choice is "system".
export function watchSystemTheme(): void {
  window.matchMedia(darkQuery).addEventListener('change', applyTheme)
  applyTheme()
}

export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, themeChoice)
}

export function useDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, isDarkTheme)
}

function storedChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(themeKey)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function applyTheme(): void {
  const dark = current === 'dark' || (current === 'system' && window.matchMedia(darkQuery).matches)
  document.documentElement.classList.toggle('dark', dark)
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
