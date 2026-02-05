"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarGradient, getAvatarInitials } from "@/lib/avatar-colors"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  name?: string
  src?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
}

export function UserAvatar({ name, src, className, size = "md" }: UserAvatarProps) {
  const initials = getAvatarInitials(name || "")
  const avatarColors = getAvatarGradient(name || "User")

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src} alt={name || "User"} />
      <AvatarFallback
        className="text-white font-semibold"
        style={{
          background: `linear-gradient(135deg, ${avatarColors.from}, ${avatarColors.to})`
        }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
