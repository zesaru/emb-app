type RawUserRow = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  admin?: string | null;
  is_active?: string | boolean | null;
  num_vacations?: string | number | null;
  num_compensatorys?: string | number | null;
  created_at?: string | null;
};

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
  isActive: boolean;
  admin: "admin" | null;
  createdAt: string | null;
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
    role,
    admin: role === "admin" ? "admin" : null,
    isActive: parseBooleanLike(row.is_active, true),
    createdAt: row.created_at ?? null,
    numVacations: parseNumberLike(row.num_vacations),
    numCompensatorys: parseNumberLike(row.num_compensatorys),
  };
}

export function toUsersTableUpdate(input: {
  name?: string | null;
  role?: "admin" | "user";
  isActive?: boolean;
  numVacations?: number;
  numCompensatorys?: number;
}) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.role !== undefined) {
    payload.role = input.role;
    payload.admin = input.role === "admin" ? "admin" : null;
  }
  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }
  if (input.numVacations !== undefined) payload.num_vacations = input.numVacations;
  if (input.numCompensatorys !== undefined) payload.num_compensatorys = input.numCompensatorys;

  return payload;
}
