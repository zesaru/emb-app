import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { UsersDirectory } from "@/app/(dashboard)/(routes)/admin/users/_components/users-directory";
import { normalizeUserRow } from "@/lib/users/user-mappers";
import "@/app/globals.css";
const users = [
  {
    ...normalizeUserRow({
      id: "special",
      name: "Persona Especial",
      email: "especial@example.test",
      position: "Secretaría",
      is_active: true,
      grant_mode: "manual",
      manual_next_grant_date: "2026-08-31",
      hire_date: "2013-03-06",
    }),
    vacationBalance: 45,
    nextVacationExpirationDate: "2027-09-01",
    vacationExpirations: [
      { date: "2027-09-01", days: 25 },
      { date: "2028-09-01", days: 20 },
    ],
    vacationSpecialNotes: ["Caso especial autorizado"],
  },
  {
    ...normalizeUserRow({
      id: "automatic",
      name: "Ana Automática",
      email: "ana@example.test",
      position: "Sistemas",
      is_active: true,
      hire_date: "2013-04-01",
      weekly_days: 5,
      weekly_hours: 40,
      attendance_eligible: true,
    }),
    vacationBalance: 19,
    nextExpectedGrantDate: "2027-10-01",
    nextVacationExpirationDate: "2027-01-01",
    vacationExpirations: [{ date: "2027-01-01", days: 19 }],
  },
  normalizeUserRow({
    id: "diplomat",
    name: "Diplomático",
    email: "diplomatico@example.test",
    is_active: true,
    is_diplomatic: true,
    admin: "admin",
  }),
  normalizeUserRow({
    id: "inactive",
    name: "Cuenta Inactiva",
    email: "inactivo@example.test",
    is_active: false,
  }),
];
function Fixture() {
  const [action, setAction] = useState("");
  return (
    <main className="mx-auto max-w-[1500px] p-3 sm:p-6">
      <UsersDirectory
        users={new URLSearchParams(location.search).has("empty") ? [] : users}
        businessDate="2026-10-15"
        busy={false}
        error={new URLSearchParams(location.search).has("error")}
        onReload={() => setAction("Actualizar")}
        onCreate={() => setAction("Crear")}
        onEdit={(u) => setAction(`Editar ${u.name}`)}
        onManage={(u) => setAction(`Gestionar ${u.name}`)}
        tools={<button>Herramienta de prueba</button>}
      />
      <p>{action}</p>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
