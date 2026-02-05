'use client';

  import { Button } from "@/components/ui/button"
  import { UserAvatar } from "@/components/user-avatar"
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
import { LogOut } from "lucide-react"
import { Logo } from "./logo"
import LogoutButton from "@/components/LogoutButton"
import { useUserName } from "@/lib/use-user"

  export function UserNav() {

    const userName = useUserName();

    return (
      <div className="flex items-center gap-3">
        {/* User Name Display */}
        <div className="hidden md:flex flex-col items-end">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {userName || "Usuario"}
          </p>
          <p className="text-xs text-gray-500 leading-tight">
            Panel de Administración
          </p>
        </div>

        {/* Avatar with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <UserAvatar name={userName || undefined} />
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName || "Usuario"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Panel de Administración
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut/><LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    )
  }