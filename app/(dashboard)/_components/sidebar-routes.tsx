"use client";

import { Compass, Layout, SmilePlus  } from "lucide-react";
import { usePathname } from "next/navigation";

import { SidebarItem } from "./sidebar-item";

const routes = [
  {
    icon: Layout,
    label: "Dashboard",
    href: "/",
  },
  {
    icon: Compass,
    label: "Compensatorios",
    href: "/compensatorios",
  },
  {
    icon: SmilePlus,
    label: "Registrar Compensatorio",
    href: "/compensatorios/new",
  },
  {
    icon: SmilePlus,
    label: "Solicitar Compensatorio",
    href: "/compensatorios/request",
  },
  {
    icon: SmilePlus,
    label: "Vacaciones",
    href: "/vacaciones/",
  },
];



export const SidebarRoutes = () => {
  const pathname = usePathname();

  const isTeacherPage = pathname?.includes("/teacher");

  return (
    <div className="flex flex-col w-full">
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      ))}
    </div>
  )
}