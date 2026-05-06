"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Building2, CalendarClock, FileText, KeyRound, ShieldCheck, TrendingUp, UsersRound } from "lucide-react"

import { hasAnyPermission } from "@/lib/auth/permissions"
import type { AuthUser } from "@/lib/auth/types"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  hasLogoAsset: boolean
  logoPath: string
  user: AuthUser
}

const navigation = [
  {
    title: "Pengguna",
    url: "/app/users",
    icon: UsersRound,
    testId: "sidebar-nav-users",
    permissions: ["read users"],
  },
  {
    title: "Klien",
    url: "/app/clients",
    icon: Building2,
    testId: "sidebar-nav-clients",
    permissions: ["manage clients"],
  },
  {
    title: "Kontrak",
    url: "/app/contracts",
    icon: FileText,
    testId: "sidebar-nav-contracts",
    permissions: ["read contracts", "manage contracts"],
  },
  {
    title: "Termin Pembayaran",
    url: "/app/payment-terms",
    icon: CalendarClock,
    testId: "sidebar-nav-payment-terms",
    permissions: ["read payment terms", "manage payment terms"],
  },
  {
    title: "Progres Proyek",
    url: "/app/project-progress",
    icon: TrendingUp,
    testId: "sidebar-nav-project-progress",
    permissions: ["read project progress", "manage project progress"],
  },
  {
    title: "Peran",
    url: "/app/roles",
    icon: ShieldCheck,
    testId: "sidebar-nav-roles",
    permissions: ["read roles"],
  },
  {
    title: "Izin akses",
    url: "/app/permissions",
    icon: KeyRound,
    testId: "sidebar-nav-permissions",
    permissions: ["read permissions"],
  },
]

function BrandBadge({ hasLogoAsset, logoPath }: { hasLogoAsset: boolean; logoPath: string }) {
  if (hasLogoAsset) {
    return (
      <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border/70 bg-transparent">
        <Image alt="Logo PT Central Saga Mandala" className="size-7 object-contain" height={28} src={logoPath} width={28} />
      </div>
    )
  }

  return (
    <div className="flex size-8 items-center justify-center rounded-lg border border-sidebar-border/70 bg-transparent text-sidebar-foreground">
      <span className="text-[10px] font-semibold tracking-[0.22em]">CS</span>
    </div>
  )
}

export function AppSidebar({ hasLogoAsset, logoPath, user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const visibleNavigation = navigation.filter((item) => hasAnyPermission(user, item.permissions))

  return (
    <Sidebar collapsible="offcanvas" data-testid="app-sidebar" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => router.push("/app")}>
              <BrandBadge hasLogoAsset={hasLogoAsset} logoPath={logoPath} />
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-medium">Kontrak Central Saga</span>
                <span className="text-xs text-sidebar-foreground/70">PT Central Saga Mandala</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleNavigation.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  data-testid={item.testId}
                  isActive={pathname.startsWith(item.url)}
                  onClick={() => router.push(item.url)}
                >
                  <item.icon />
                  <span className="font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto gap-3 pt-0" data-testid="app-sidebar-footer">
        <SidebarSeparator className="mx-0" />
        <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 text-sm group-data-[collapsible=icon]:hidden">
          <p className="font-medium text-sidebar-foreground">Navigasi akses</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
            Menu hanya menampilkan modul yang sesuai dengan izin akun aktif.
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
