"use client"

import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react"

import type { ThemePreference } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { useThemePreference } from "@/components/theme/theme-provider"
import { Button } from "@/components/ui/button"

const themeOptions: Array<{
  description: string
  icon: typeof SunMedium
  label: string
  testId: string
  value: ThemePreference
}> = [
  {
    description: "Cocok untuk area kerja terang dengan kontras yang tegas.",
    icon: SunMedium,
    label: "Terang",
    testId: "theme-option-light",
    value: "light",
  },
  {
    description: "Mengurangi silau dan menjaga fokus saat bekerja lama.",
    icon: MoonStar,
    label: "Gelap",
    testId: "theme-option-dark",
    value: "dark",
  },
  {
    description: "Mengikuti preferensi sistem perangkat Anda secara otomatis.",
    icon: LaptopMinimal,
    label: "Sistem",
    testId: "theme-option-system",
    value: "system",
  },
]

export function ThemePreferenceCard() {
  const { preference, resolvedTheme, setPreference } = useThemePreference()

  return (
    <div className="flex flex-col gap-5" data-testid="theme-preference-card">
      <div className="rounded-3xl border border-line bg-card-strong p-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-highlight">Preferensi aktif</p>
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-2xl font-semibold text-foreground">
            {preference === "system" ? "Ikuti sistem" : preference === "dark" ? "Gelap" : "Terang"}
          </p>
          <p className="text-sm leading-6 text-muted">
            Tampilan yang sedang diterapkan sekarang: <span className="font-medium text-foreground">{resolvedTheme === "dark" ? "Gelap" : "Terang"}</span>.
            Preferensi ini disimpan di perangkat yang sedang Anda gunakan.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {themeOptions.map((option) => {
          const Icon = option.icon
          const isActive = preference === option.value

          return (
            <button
              key={option.value}
              aria-pressed={isActive}
              className={cn(
                "flex min-h-40 flex-col items-start justify-between rounded-3xl border px-5 py-5 text-left transition-all",
                isActive
                  ? "border-primary bg-primary/8 shadow-[0_18px_40px_rgba(24,33,39,0.1)]"
                  : "border-line bg-card-strong hover:border-primary/40 hover:bg-background"
              )}
              data-testid={option.testId}
              type="button"
              onClick={() => setPreference(option.value)}
            >
              <div className="flex size-11 items-center justify-center rounded-2xl border border-line bg-background text-foreground">
                <Icon />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">{option.label}</span>
                  {isActive ? <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">Aktif</span> : null}
                </div>
                <p className="text-sm leading-6 text-muted">{option.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="sm" type="button" variant="outline" onClick={() => setPreference("system")}>
          Kembalikan ke sistem
        </Button>
      </div>
    </div>
  )
}
