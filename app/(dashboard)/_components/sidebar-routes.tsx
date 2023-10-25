"use client";

import { Compass, Layout, SmilePlus, Palmtree, LayoutList, CalendarDays     } from "lucide-react";

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
    icon: LayoutList,
    label: "Vacaciones",
    href: "/vacaciones/",
  },
  {
    icon: Palmtree,
    label: "Solicitar Vacaciones",
    href: "/vacaciones/new",
  },
  {
    icon: CalendarDays ,
    label: "Calendario Vacaciones",
    href: "/calendar/",
  },
  {
    icon: SmilePlus,
    label: "Asistencia",
    href: "/attendances",
  }
];



export const SidebarRoutes = () => {

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