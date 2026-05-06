import type { AuthUser } from "@/lib/auth/types"

export function hasRole(user: Pick<AuthUser, "roles">, role: string): boolean {
  return user.roles.includes(role)
}

export function hasAnyPermission(user: Pick<AuthUser, "permissions" | "roles">, permissions: string[]): boolean {
  return hasRole(user, "admin") || permissions.some((permission) => user.permissions.includes(permission))
}

export function hasAllPermissions(user: Pick<AuthUser, "permissions" | "roles">, permissions: string[]): boolean {
  return hasRole(user, "admin") || permissions.every((permission) => user.permissions.includes(permission))
}
