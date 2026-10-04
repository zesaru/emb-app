import React from "react";
import { createRoot } from "react-dom/client";
import Calendar from "@/app/(dashboard)/(routes)/calendar/_components/calendar";
import "@/app/globals.css";

// Match the route's spacing without loading protected server components.
createRoot(document.getElementById("root")!).render(
  <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-10">
    <Calendar initialDate="2026-10-04" />
  </main>
);
