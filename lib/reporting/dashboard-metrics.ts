type VacationRow = {
  id: string;
  created_at: string;
  start: string | null;
  finish: string | null;
  days: number | null;
  approve_request: boolean | null;
};

type CompensatoryRow = {
  id: string;
  created_at: string;
  event_date: string | null;
  event_name: string | null;
  hours: number | null;
  compensated_hours: number | null;
  approve_request: boolean | null;
  final_approve_request: boolean | null;
  cancelled_at: string | null;
};

export type DashboardReport = {
  generatedAt: string;
  overview: {
    activeEmployees: number;
    vacationBalance: number;
    pendingVacations: number;
    activeVacations: number;
    approvedVacationDaysThisMonth: number;
    pendingCompensatoryRequests: number;
    pendingCompensatoryRests: number;
    compensatoryHoursAvailable: number;
  };
  vacationStatus: { label: string; value: number; color: string }[];
  monthlyVacationDays: { label: string; approved: number; requested: number }[];
  upcomingVacations: { start: string; finish: string; days: number }[];
  employees: EmployeeTimeReportRow[];
};

export type EmployeeTimeReportRow = {
  id: string;
  name: string;
  email: string;
  hireDate: string | null;
  vacationBalance: number;
  nextRenewalDate: string | null;
  nextExpiryDate: string | null;
  compensatoryApprovedHours: number;
  compensatoryAvailableHours: number;
  recommendation: "urgent" | "plan" | "healthy";
};

const monthFormatter = new Intl.DateTimeFormat("es-PE", { month: "short" });

function asDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildDashboardReport(input: {
  activeEmployees: number;
  vacationBalance: number;
  compensatoryHoursAvailable: number;
  vacations: VacationRow[];
  compensatorys: CompensatoryRow[];
  employees?: EmployeeTimeReportRow[];
  now?: Date;
}): DashboardReport {
  const now = input.now ?? new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const pendingVacations = input.vacations.filter((row) => !row.approve_request);
  const approvedVacations = input.vacations.filter((row) => row.approve_request);
  const activeVacations = approvedVacations.filter((row) => {
    const start = asDate(row.start);
    const finish = asDate(row.finish);
    return start != null && finish != null && now >= start && now <= finish;
  });
  const approvedVacationDaysThisMonth = approvedVacations
    .filter((row) => {
      const start = asDate(row.start);
      return start != null && start >= monthStart && start.getFullYear() === now.getFullYear();
    })
    .reduce((total, row) => total + Number(row.days ?? 0), 0);

  // These conditions intentionally mirror the two admin approval queues.
  // A compensatory request has an event name; a rest request does not.
  const pendingCompensatoryRequests = input.compensatorys.filter(
    (row) => row.event_name != null && row.approve_request == null && row.cancelled_at == null,
  ).length;
  const pendingCompensatoryRests = input.compensatorys.filter(
    (row) => row.event_name == null && row.final_approve_request == null && row.cancelled_at == null,
  ).length;

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { date, key: `${date.getFullYear()}-${date.getMonth()}` };
  });

  const monthlyVacationDays = months.map(({ date, key }) => {
    const records = input.vacations.filter((row) => {
      const start = asDate(row.start);
      return start != null && `${start.getFullYear()}-${start.getMonth()}` === key;
    });
    return {
      label: monthFormatter.format(date).replace(".", ""),
      requested: records.reduce((total, row) => total + Number(row.days ?? 0), 0),
      approved: records
        .filter((row) => row.approve_request)
        .reduce((total, row) => total + Number(row.days ?? 0), 0),
    };
  });

  return {
    generatedAt: now.toISOString(),
    overview: {
      activeEmployees: input.activeEmployees,
      vacationBalance: input.vacationBalance,
      pendingVacations: pendingVacations.length,
      activeVacations: activeVacations.length,
      approvedVacationDaysThisMonth,
      pendingCompensatoryRequests,
      pendingCompensatoryRests,
      compensatoryHoursAvailable: input.compensatoryHoursAvailable,
    },
    vacationStatus: [
      { label: "Aprobadas", value: approvedVacations.length, color: "bg-emerald-500" },
      { label: "Pendientes", value: pendingVacations.length, color: "bg-amber-400" },
      { label: "Activas", value: activeVacations.length, color: "bg-sky-500" },
    ],
    monthlyVacationDays,
    upcomingVacations: approvedVacations
      .filter((row) => {
        const start = asDate(row.start);
        return start != null && start > now;
      })
      .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""))
      .slice(0, 5)
      .map((row) => ({ start: row.start ?? "", finish: row.finish ?? "", days: Number(row.days ?? 0) })),
    employees: input.employees ?? [],
  };
}
