'use client'

import { User, Settings, Shield, Calendar, Users, Loader2 } from 'lucide-react'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
  import { Button } from "@/components/ui/button"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import LogoutButton from "@/components/LogoutButton"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { getInitials } from "@/lib/acronym"
import { ChangePasswordDialog } from "./change-password-dialog"
  
export function UserNav() {
  const { profile, loading, isAdmin } = useCurrentUser()

  if (loading) {
    return (
      <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!profile) {
    return (
      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
        <Avatar className="h-10 w-10">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  const initials = getInitials(profile.name)
  const displayName = profile.name || 'Usuario'
  const displayEmail = profile.email || 'Sin email'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-gray-200 transition-all">
          <Avatar className="h-10 w-10 border-2 border-white shadow-md">
            <AvatarImage 
              src={profile.avatar_url || "/avatars/user.svg"} 
              alt={displayName} 
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Indicador online */}
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={profile.avatar_url || "/avatars/user.svg"} 
                alt={displayName} 
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                {isAdmin && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground mt-1">
                {displayEmail}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">En línea</span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Mi Calendario</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuración</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <ChangePasswordDialog />
          </DropdownMenuItem>
          
          {isAdmin && (
            <DropdownMenuItem className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span>Gestionar Usuarios</span>
              <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <div className="w-full">
            <LogoutButton variant="dropdown" showConfirmation={true} />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}