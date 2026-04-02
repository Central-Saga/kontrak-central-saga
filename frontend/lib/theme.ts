export const THEME_STORAGE_KEY = "kcs-theme-preference"

export const THEME_OPTIONS = ["light", "dark", "system"] as const

export type ThemePreference = (typeof THEME_OPTIONS)[number]
export type ResolvedTheme = "light" | "dark"

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return THEME_OPTIONS.includes(value as ThemePreference)
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light"
  }

  return preference
}
