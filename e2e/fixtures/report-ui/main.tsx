import React from "react";
import { createRoot } from "react-dom/client";
import { StaffReportView } from "@/app/(dashboard)/(routes)/report/_components/staff-report-view";
import { report } from "./data";
import "@/app/globals.css";
createRoot(document.getElementById("root")!).render(
  <>
    <div data-dashboard-chrome className="h-16 bg-slate-900 p-4 text-white">
      Navegación de prueba
    </div>
    <main className="bg-slate-50 p-3 sm:p-6">
      <StaffReportView initialReport={report} />
    </main>
  </>,
);
