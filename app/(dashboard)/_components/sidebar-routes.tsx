"use client";

import {
  BookOpenText,
  CalendarDays,
  Compass,
  DatabaseBackup,
  Layout,
  LayoutList,
  Palmtree,
  Shield,
  SmilePlus,
} from "lucide-react";

import { SidebarItem } from "./sidebar-item";

const routes = [
  {
    icon: Layout,
    label: "Inicio",
    href: "/",
  },
  {
    icon: Compass,
    label: "Compensatorios",
    href: "/compensatorios",
  },
  {
    icon: SmilePlus,
    label: "Registrar compensatorio",
    href: "/compensatorios/new",
  },
  {
    icon: SmilePlus,
    label: "Solicitar compensatorio",
    href: "/compensatorios/request",
  },
  {
    icon: LayoutList,
    label: "Vacaciones",
    href: "/vacaciones",
  },
  {
    icon: Palmtree,
    label: "Solicitar vacaciones",
    href: "/vacaciones/new",
  },
  {
    icon: BookOpenText,
    label: "Política de vacaciones",
    href: "/vacaciones/policy",
  },
  {
    icon: CalendarDays,
    label: "Calendario de vacaciones",
    href: "/calendar",
  },
  {
    icon: LayoutList,
    label: "Reportes",
    href: "/report",
  },
  {
    icon: DatabaseBackup,
    label: "Backups",
    href: "/backups",
  },
  {
    icon: Shield,
    label: "Administración de usuarios",
    href: "/admin/users",
    adminOnly: true,
  },
];

export const SidebarRoutes = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const visibleRoutes = routes.filter((route) => !route.adminOnly || isAdmin);

  return (
    <div className="flex w-full flex-col">
      {visibleRoutes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      ))}
    </div>
  );
};
