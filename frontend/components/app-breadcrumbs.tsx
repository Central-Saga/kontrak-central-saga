"use client"

import { Fragment } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const segmentLabels: Record<string, string> = {
  app: "Beranda",
  permissions: "Izin akses",
  profile: "Profil",
  roles: "Peran",
  settings: "Pengaturan",
  users: "Pengguna",
  new: "Tambah",
  edit: "Ubah",
}

function isDynamicSegment(segment: string) {
  return /^\d+$/.test(segment) || /^[0-9a-f]{8,}$/i.test(segment)
}

function formatSegment(segment: string) {
  const label = segmentLabels[segment]

  if (label) {
    return label
  }

  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function AppBreadcrumbs() {
  const pathname = usePathname()
  const rawSegments = pathname.split("/").filter(Boolean)
  const segments = rawSegments.filter((segment, index) => {
    if (index === 0) {
      return segment === "app"
    }

    return !isDynamicSegment(segment)
  })

  const crumbs = segments.slice(1).map((segment, index) => {
    const href = `/${segments.slice(0, index + 2).join("/")}`

    return {
      href,
      label: formatSegment(segment),
    }
  })

  return (
    <Breadcrumb data-testid="app-breadcrumbs">
      <BreadcrumbList>
        {crumbs.length ? (
          <>
            <BreadcrumbItem>
              <Link className={cn("transition-colors hover:text-foreground")} href="/app">
                Beranda
              </Link>
            </BreadcrumbItem>

            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1

              return (
                <Fragment key={crumb.href}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage data-testid="app-shell-heading">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <Link className={cn("transition-colors hover:text-foreground")} href={crumb.href}>
                        {crumb.label}
                      </Link>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage data-testid="app-shell-heading">Beranda</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
