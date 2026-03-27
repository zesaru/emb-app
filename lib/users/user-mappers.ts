type RawUserRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  position?: string | null;
  role?: string | null;
  admin?: string | null;
  is_active?: string | boolean | null;
  num_vacations?: string | number | null;
  num_compensatorys?: string | number | null;
  created_at?: string | null;
  hire_date?: string | null;
  is_diplomatic?: boolean | string | null;
  weekly_days?: string | number | null;
  weekly_hours?: string | number | null;
  attendance_eligible?: boolean | string | null;
  grant_mode?: string | null;
  manual_next_grant_date?: string | null;
};

export type UserGrantMode = "automatic" | "manual";

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  position: string | null;
  isActive: boolean;
  admin: "admin" | null;
  createdAt: string | null;
  hireDate: string | null;
  isDiplomatic: boolean;
  weeklyDays: number | null;
  weeklyHours: number | null;
  attendanceEligible: boolean | null;
  grantMode: UserGrantMode;
  manualNextGrantDate: string | null;
  nextExpectedGrantDate: string | null;
  numVacations: number;
  numCompensatorys: number;
};

function parseBooleanLike(value: unknown, defaultValue = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "activo", "active"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "inactivo", "inactive"].includes(normalized)) return false;
  }
  return defaultValue;
}

function parseNumberLike(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function parseNullableNumberLike(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseNullableBooleanLike(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "si", "eligible"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "ineligible"].includes(normalized)) return false;
  }
  return null;
}

function parseGrantMode(value: unknown): UserGrantMode {
  return value === "manual" ? "manual" : "automatic";
}

export function normalizeUserRole(row: Pick<RawUserRow, "admin" | "role">): "admin" | "user" {
  if (row.admin === "admin") return "admin";
  if ((row.role || "").toLowerCase() === "admin") return "admin";
  return "user";
}

export function normalizeUserRow(row: RawUserRow): AdminUserListItem {
  const role = normalizeUserRole(row);

  return {
    id: row.id,
    email: row.email || "",
    name: row.name ?? null,
    position: row.position ?? null,
    role,
    admin: role === "admin" ? "admin" : null,
    isActive: parseBooleanLike(row.is_active, true),
    createdAt: row.created_at ?? null,
    hireDate: row.hire_date ?? null,
    isDiplomatic: parseBooleanLike(row.is_diplomatic, false),
    weeklyDays: parseNullableNumberLike(row.weekly_days),
    weeklyHours: parseNullableNumberLike(row.weekly_hours),
    attendanceEligible: parseNullableBooleanLike(row.attendance_eligible),
    grantMode: parseGrantMode(row.grant_mode),
    manualNextGrantDate: row.manual_next_grant_date ?? null,
    nextExpectedGrantDate: null,
    numVacations: parseNumberLike(row.num_vacations),
    numCompensatorys: parseNumberLike(row.num_compensatorys),
  };
}

export function toUsersTableUpdate(input: {
  name?: string | null;
  role?: "admin" | "user";
  position?: string | null;
  isActive?: boolean;
  hireDate?: string | null;
  isDiplomatic?: boolean;
  weeklyDays?: number | null;
  weeklyHours?: number | null;
  attendanceEligible?: boolean | null;
  grantMode?: UserGrantMode;
  manualNextGrantDate?: string | null;
  numVacations?: number;
  numCompensatorys?: number;
}) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.role !== undefined) {
    payload.role = input.role;
    payload.admin = input.role === "admin" ? "admin" : null;
  }
  if (input.position !== undefined) payload.position = input.position;
  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }
  if (input.hireDate !== undefined) payload.hire_date = input.hireDate;
  if (input.isDiplomatic !== undefined) payload.is_diplomatic = input.isDiplomatic;
  if (input.weeklyDays !== undefined) payload.weekly_days = input.weeklyDays;
  if (input.weeklyHours !== undefined) payload.weekly_hours = input.weeklyHours;
  if (input.attendanceEligible !== undefined) payload.attendance_eligible = input.attendanceEligible;
  if (input.grantMode !== undefined) payload.grant_mode = input.grantMode;
  if (input.manualNextGrantDate !== undefined) payload.manual_next_grant_date = input.manualNextGrantDate;
  if (input.numVacations !== undefined) payload.num_vacations = input.numVacations;
  if (input.numCompensatorys !== undefined) payload.num_compensatorys = input.numCompensatorys;

  return payload;
}
