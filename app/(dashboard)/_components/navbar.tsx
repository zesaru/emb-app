"use client"

import { MobileSidebar } from "./mobile-sidebar";
import { UserNav } from "./user-nav";

const Navbar = ({ userName, isAdmin, isSuperAdmin }: { userName: string; isAdmin: boolean; isSuperAdmin: boolean }) => {
    return (
        <div className="p-4 border-b h-full flex justify-between items-center bg-white shadow-sm">
          <MobileSidebar isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />
          <UserNav userName={userName} />
        </div>
      );
}
 
export default Navbar;