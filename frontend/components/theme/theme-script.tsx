import { THEME_STORAGE_KEY } from "@/lib/theme"

const themeScript = `
(() => {
  try {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const storedPreference = window.localStorage.getItem(storageKey);
    const preference = storedPreference === "light" || storedPreference === "dark" || storedPreference === "system"
      ? storedPreference
      : "system";
    const resolvedTheme = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
    const root = document.documentElement;

    root.classList.toggle("dark", resolvedTheme === "dark");
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolvedTheme;
  } catch {}
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
}
