"use client";

import { Logo } from "./logo";
import { SidebarRoutes } from "./sidebar-routes";

export type SidebarAccess = { isAdmin: boolean; isSuperAdmin: boolean };

const Sidebar = ({ isAdmin, isSuperAdmin }: SidebarAccess) => {
  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6">
        <Logo />
      </div>
      <div className="flex flex-col w-full">
        <SidebarRoutes isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  );
};

export default Sidebar;
