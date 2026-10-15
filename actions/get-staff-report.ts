"use server";

import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { requireCurrentUserAdminAndActive } from "@/lib/auth/admin-check";
import { listUserVacationGrants } from "@/actions/admin/vacation-grants/list-user-grants";
import {
  buildStaffReport,
  defaultReportPeriod,
  validateReportPeriod,
  vacationInPeriod,
} from "@/lib/reporting/staff-report";
import type { IndividualStaffReport, ReportPeriod } from "@/lib/reporting/staff-report";

async function loadReport(period: ReportPeriod, userId?: string) {
  await requireCurrentUserAdminAndActive();
  const validPeriod = validateReportPeriod(period);
  const supabase = await createClient();
  // Every collection is read completely with a stable unique ordering. A failed batch fails the report.
  async function readUsers() {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase
        .from("users")
        .select(
          "id,name,email,position,is_active,is_diplomatic,hire_date,grant_mode,manual_next_grant_date",
        );
      if (userId) query = query.eq("id", userId);
      const { data, error } = await query.order("id").range(offset, offset + 999);
      if (error || !data) throw new Error("No se pudieron cargar los colaboradores del reporte.");
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }
  async function readGrants() {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase
        .from("vacation_grants")
        .select("id,user_id,granted_on,expires_on,days_granted,days_remaining,rule_type,notes");
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query.order("id").range(offset, offset + 999);
      if (error || !data) throw new Error("No se pudieron cargar los saldos y vencimientos.");
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }
  async function readVacations() {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase
        .from("vacations")
        .select("id,id_user,start,finish,days,approve_request,cancelled_at,request_date");
      if (userId) query = query.eq("id_user", userId);
      const { data, error } = await query.order("id").range(offset, offset + 999);
      if (error || !data) throw new Error("No se pudo cargar el historial de vacaciones.");
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }
  async function readCompensatory() {
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase
        .from("compensatorys")
        .select("id,user_id,event_name,hours,compensated_hours,approve_request,cancelled_at");
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query.order("id").range(offset, offset + 999);
      if (error || !data) throw new Error("No se pudieron cargar los compensatorios.");
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }
  const [users, grants, vacations, compensatory] = await Promise.all([
    readUsers(),
    readGrants(),
    readVacations(),
    readCompensatory(),
  ]);
  return {
    report: buildStaffReport({ users, grants, vacations, compensatory, period: validPeriod }),
    vacations,
  };
}

export async function getStaffReport(period: ReportPeriod = defaultReportPeriod()) {
  return (await loadReport(period)).report;
}

export async function getIndividualStaffReport(input: {
  userId: string;
  period: ReportPeriod;
}): Promise<IndividualStaffReport> {
  const userId = z.string().uuid().parse(input.userId);
  const { report, vacations } = await loadReport(input.period, userId);
  const employee = report.employees[0];
  if (!employee) throw new Error("No se encontró el colaborador o no tienes acceso a su informe.");
  const grants = await listUserVacationGrants({ userId });
  if (!grants.success) throw new Error(grants.error);
  return {
    generatedAt: report.generatedAt,
    today: report.today,
    period: report.period,
    employee,
    vacations: vacations
      .filter((row) => vacationInPeriod(row, report.period))
      .sort(
        (a, b) =>
          (b.start ?? b.request_date ?? "").localeCompare(a.start ?? a.request_date ?? "") ||
          b.id.localeCompare(a.id),
      ),
    grants: grants.data,
  };
}
