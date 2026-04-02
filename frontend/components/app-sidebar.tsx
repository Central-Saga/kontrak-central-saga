"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { KeyRound, ShieldCheck, UsersRound } from "lucide-react"

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
}

const navigation = [
  {
    title: "Pengguna",
    url: "/app/users",
    icon: UsersRound,
    testId: "sidebar-nav-users",
  },
  {
    title: "Peran",
    url: "/app/roles",
    icon: ShieldCheck,
    testId: "sidebar-nav-roles",
  },
  {
    title: "Izin akses",
    url: "/app/permissions",
    icon: KeyRound,
    testId: "sidebar-nav-permissions",
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

export function AppSidebar({ hasLogoAsset, logoPath, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" data-testid="app-sidebar" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app">
                <BrandBadge hasLogoAsset={hasLogoAsset} logoPath={logoPath} />
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="font-medium">Kontrak Central Saga</span>
                  <span className="text-xs text-sidebar-foreground/70">PT Central Saga Mandala</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navigation.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                  <Link className="font-medium" data-testid={item.testId} href={item.url}>
                    <item.icon />
                    {item.title}
                  </Link>
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
            Kelola pengguna, peran, dan izin akses dari menu utama aplikasi.
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
