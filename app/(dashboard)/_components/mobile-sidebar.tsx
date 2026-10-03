"use client"

import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import Sidebar, { type SidebarAccess } from "./sidebar";

export const MobileSidebar = ({ isAdmin, isSuperAdmin }: SidebarAccess) => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pr-4 hover:opacity-75 transition">
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-white">
        <Sidebar isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
      </SheetContent>
    </Sheet>
  )
}