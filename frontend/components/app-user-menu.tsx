"use client"

import Link from "next/link"
import { ChevronDown, LogOut, Settings, UserCircle2 } from "lucide-react"

import type { AuthUser } from "@/lib/auth/types"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserAvatar } from "@/components/user-avatar"

type AppUserMenuProps = {
  user: AuthUser
}

export function AppUserMenu({ user }: AppUserMenuProps) {
  const primaryRole = user.roles[0] ?? "Akun internal"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 rounded-full border border-border/70 bg-card-strong px-2 py-1.5 text-left shadow-xs transition-colors hover:bg-secondary/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-hidden"
          )}
          data-testid="user-menu-trigger"
          type="button"
        >
          <UserAvatar className="size-10 border border-border/70" imageUrl={user.avatarUrl} name={user.name} />
          <div className="hidden min-w-0 flex-col sm:flex">
            <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
            <span className="truncate text-xs text-muted">{user.email}</span>
          </div>
          <ChevronDown className="text-muted" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div data-testid="user-menu" className="flex items-center gap-3">
            <UserAvatar className="size-11 border border-border/70" imageUrl={user.avatarUrl} name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <p className="truncate text-xs text-muted">{primaryRole}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/app/profile">
              <UserCircle2 />
              Profil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/settings">
              <Settings />
              Pengaturan
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <form action="/auth/logout?redirect=/login" method="POST">
            <DropdownMenuItem asChild variant="destructive">
              <button className="flex w-full items-center gap-2" data-testid="logout-button" type="submit">
                <LogOut />
                Keluar
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
