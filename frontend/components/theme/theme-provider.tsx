"use client"

import * as React from "react"

import {
  isThemePreference,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
  THEME_STORAGE_KEY,
} from "@/lib/theme"

type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemPreference() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function applyTheme(preference: ThemePreference) {
  const resolvedTheme = resolveThemePreference(preference, getSystemPreference())
  const root = document.documentElement

  root.classList.toggle("dark", resolvedTheme === "dark")
  root.dataset.themePreference = preference
  root.style.colorScheme = resolvedTheme

  return resolvedTheme
}

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system"
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY)

  return isThemePreference(storedPreference) ? storedPreference : "system"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = React.useState<ThemePreference>("system")
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>("light")

  React.useEffect(() => {
    const nextPreference = readStoredPreference()
    setPreferenceState(nextPreference)
    setResolvedTheme(applyTheme(nextPreference))

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      const latestPreference = readStoredPreference()

      if (latestPreference === "system") {
        setResolvedTheme(applyTheme(latestPreference))
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
  }, [])

  const setPreference = React.useCallback((nextPreference: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference)
    setPreferenceState(nextPreference)
    setResolvedTheme(applyTheme(nextPreference))
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemePreference() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useThemePreference must be used within ThemeProvider.")
  }

  return context
}
