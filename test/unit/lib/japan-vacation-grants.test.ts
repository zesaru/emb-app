import { describe, expect, it } from "vitest";

import {
  buildJapanVacationGrantDraft,
  determineJapanVacationRuleType,
  getJapanGrantedDays,
  getJapanNextGrantDate,
  resolveJapanNextExpectedGrantDate,
  resolveJapanUpcomingGrantDate,
  resolveJapanServiceBand,
} from "@/lib/vacations/japan-vacation-grants";

describe("resolveJapanServiceBand", () => {
  it("detecta el primer grant a los 6 meses", () => {
    expect(resolveJapanServiceBand("2025-01-01", "2025-07-01")).toBe("6_months");
  });

  it("detecta el tramo maximo desde 6 años y 6 meses", () => {
    expect(resolveJapanServiceBand("2018-01-01", "2024-07-01")).toBe("6_years_6_months_plus");
  });

  it("devuelve null antes de cumplir 6 meses", () => {
    expect(resolveJapanServiceBand("2025-01-01", "2025-06-30")).toBeNull();
  });
});

describe("determineJapanVacationRuleType", () => {
  it("usa regla estandar con 5 dias semanales", () => {
    expect(determineJapanVacationRuleType({ weeklyDays: 5, weeklyHours: 20 })).toBe("standard");
  });

  it("usa regla estandar con 30 horas semanales", () => {
    expect(determineJapanVacationRuleType({ weeklyDays: 4, weeklyHours: 30 })).toBe("standard");
  });

  it("usa regla proporcional con 3 dias semanales", () => {
    expect(determineJapanVacationRuleType({ weeklyDays: 3, weeklyHours: 24 })).toBe("proportional");
  });

  it("permite override manual cuando se define explicitamente", () => {
    expect(determineJapanVacationRuleType({
      weeklyDays: 5,
      weeklyHours: 35,
      ruleTypeOverride: "manual",
    })).toBe("manual");
  });
});

describe("getJapanGrantedDays", () => {
  it("calcula grant estandar", () => {
    expect(getJapanGrantedDays({
      serviceBand: "3_years_6_months",
      ruleType: "standard",
    })).toBe(14);
  });

  it("calcula grant proporcional", () => {
    expect(getJapanGrantedDays({
      serviceBand: "4_years_6_months",
      ruleType: "proportional",
      weeklyDays: 2,
    })).toBe(6);
  });
});

describe("buildJapanVacationGrantDraft", () => {
  it("construye un grant estandar valido", () => {
    const result = buildJapanVacationGrantDraft({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      hireDate: "2024-01-01",
      grantedOn: "2024-07-01",
      weeklyDays: 5,
      weeklyHours: 40,
      attendanceEligible: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.grant).toMatchObject({
      service_band: "6_months",
      days_granted: 10,
      days_remaining: 10,
      rule_type: "standard",
      expires_on: "2026-07-01",
    });
  });

  it("bloquea grants con asistencia pendiente", () => {
    expect(buildJapanVacationGrantDraft({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      hireDate: "2024-01-01",
      grantedOn: "2024-07-01",
      weeklyDays: 5,
      weeklyHours: 40,
      attendanceEligible: null,
    })).toEqual({
      ok: false,
      reason: "attendance_pending",
    });
  });

  it("bloquea grants si la jornada no permite decidir la regla", () => {
    expect(buildJapanVacationGrantDraft({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      hireDate: "2024-01-01",
      grantedOn: "2024-07-01",
      attendanceEligible: true,
    })).toEqual({
      ok: false,
      reason: "invalid_schedule",
    });
  });

  it("bloquea grants con asistencia no elegible", () => {
    expect(buildJapanVacationGrantDraft({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      hireDate: "2024-01-01",
      grantedOn: "2024-07-01",
      weeklyDays: 5,
      weeklyHours: 40,
      attendanceEligible: false,
    })).toEqual({
      ok: false,
      reason: "attendance_ineligible",
    });
  });

  it("bloquea grants antes del primer hito legal", () => {
    expect(buildJapanVacationGrantDraft({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      hireDate: "2024-01-01",
      grantedOn: "2024-06-30",
      weeklyDays: 5,
      weeklyHours: 40,
      attendanceEligible: true,
    })).toEqual({
      ok: false,
      reason: "grant_before_eligibility",
    });
  });
});

describe("getJapanNextGrantDate", () => {
  it("calcula el siguiente grant anual tras los 6 meses", () => {
    expect(getJapanNextGrantDate("2024-01-01", "2024-07-01")).toBe("2025-07-01");
  });

  it("mantiene la cadencia anual tras el tramo maximo", () => {
    expect(getJapanNextGrantDate("2018-01-01", "2024-07-01")).toBe("2025-07-01");
  });
});

describe("resolveJapanUpcomingGrantDate", () => {
  it("usa los 6 meses cuando no hay grants previos", () => {
    expect(resolveJapanUpcomingGrantDate("2025-09-16", null)).toBe("2026-03-16");
  });

  it("usa el ultimo grant emitido para calcular el siguiente", () => {
    expect(resolveJapanUpcomingGrantDate("2025-09-16", "2026-03-16")).toBe("2027-03-16");
  });
});

describe("resolveJapanNextExpectedGrantDate", () => {
  it("busca el siguiente hito futuro si no existen grants historicos", () => {
    expect(resolveJapanNextExpectedGrantDate("2024-07-01", null, "2026-03-26")).toBe("2027-01-01");
  });

  it("mantiene la cadencia anual desde el primer grant a los 6 meses", () => {
    expect(resolveJapanNextExpectedGrantDate("2013-04-01", null, "2026-03-26")).toBe("2026-10-01");
  });

  it("mantiene el siguiente grant desde el ultimo grant emitido", () => {
    expect(resolveJapanNextExpectedGrantDate("2025-09-16", "2026-03-16", "2026-03-26")).toBe("2027-03-16");
  });

  it("ignora grants manuales de cutover como ancla de la cadencia futura", () => {
    expect(resolveJapanNextExpectedGrantDate("2013-04-01", {
      grantedOn: "2026-04-01",
      ruleType: "manual",
      notes: "[cutover:2026-04-01] Initial manual grant from legacy num_vacations",
    }, "2026-03-26")).toBe("2026-10-01");
  });

  it("mantiene la cadencia desde grants manuales no marcados como cutover", () => {
    expect(resolveJapanNextExpectedGrantDate("2025-09-16", {
      grantedOn: "2026-03-16",
      ruleType: "manual",
      notes: "Ajuste manual validado por administracion",
    }, "2026-03-26")).toBe("2027-03-16");
  });
});
