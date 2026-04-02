import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type UserAvatarProps = {
  imageUrl?: string | null
  name: string
  className?: string
  fallbackClassName?: string
}

function getInitials(name: string) {
  const segments = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!segments.length) {
    return "AK"
  }

  return segments.map((segment) => segment.charAt(0).toUpperCase()).join("")
}

export function UserAvatar({ className, fallbackClassName, imageUrl, name }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {imageUrl ? <AvatarImage alt={`Avatar ${name}`} src={imageUrl} /> : null}
      <AvatarFallback className={cn("bg-accent-soft text-accent", fallbackClassName)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
