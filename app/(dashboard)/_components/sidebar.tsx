"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";

import { Logo } from "./logo";
import { SidebarRoutes } from "./sidebar-routes";

const Sidebar = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAdminState = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !mounted) return;

        const { data } = await supabase
          .from("users")
          .select("admin, role")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        const admin = data?.admin === "admin" || String(data?.role || "").toLowerCase() === "admin";
        setIsAdmin(Boolean(admin));
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };

    loadAdminState();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-full border-r flex flex-col overflow-y-auto bg-white shadow-sm">
      <div className="p-6">
        <Logo />
      </div>
      <div className="flex flex-col w-full">
        <SidebarRoutes isAdmin={isAdmin} />
      </div>
    </div>
  );
};

export default Sidebar;
