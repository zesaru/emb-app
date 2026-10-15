import type { AdminUserListItem } from "./user-mappers";

export function userReviewReasons(user: AdminUserListItem, today: string): string[] {
  if (user.isDiplomatic || !user.isActive) return [];
  const reasons: string[] = [];
  if (!user.hireDate) reasons.push("Falta fecha de ingreso");
  if (user.weeklyDays == null || user.weeklyHours == null) reasons.push("Falta completar jornada");
  if (user.attendanceEligible == null) reasons.push("Asistencia pendiente de revisión");
  if (user.attendanceEligible === false) reasons.push("Asistencia no elegible");
  if (user.grantMode === "manual" && user.manualNextGrantDate && user.manualNextGrantDate < today) {
    reasons.push("Revisar fecha de asignación manual");
  }
  return reasons;
}

export function expiresWithin90Days(date: string | null, today: string): boolean {
  if (!date || date < today) return false;
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + 90);
  return date <= limit.toISOString().slice(0, 10);
}

export const roleLabel = (role: AdminUserListItem["role"]) =>
  role === "super_admin" ? "Superadministrador" : role === "admin" ? "Administrador" : "Usuario";

export function assignmentLabel(user: AdminUserListItem, today: string): string {
  if (user.isDiplomatic) return "No aplica";
  if (user.grantMode === "manual") {
    if (!user.manualNextGrantDate) return "Fecha por definir";
    return user.manualNextGrantDate < today ? "Revisar fecha manual" : "Fecha manual prevista";
  }
  return user.nextExpectedGrantDate ? "Próxima asignación" : "Falta fecha de ingreso";
}
