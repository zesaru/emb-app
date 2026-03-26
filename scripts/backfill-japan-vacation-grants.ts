#!/usr/bin/env tsx

import pg from "pg";
import { resolveJapanServiceBand } from "@/lib/vacations/japan-vacation-grants";

const { Client } = pg;

type CliOptions = {
  apply: boolean;
  cutoverDate: string;
  databaseUrl: string;
};

type BackfillUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  hire_date: string | null;
  weekly_days: number | null;
  weekly_hours: number | null;
  attendance_eligible: boolean | null;
  num_vacations: number | null;
  is_active: boolean | null;
};

type ExistingGrantRow = {
  id: string;
};

type SkipReason =
  | "already_backfilled"
  | "inactive_user"
  | "missing_hire_date"
  | "non_positive_legacy_balance";

type BackfillDecision =
  | { action: "skip"; reason: SkipReason }
  | {
      action: "insert";
      grant: {
        user_id: string;
        granted_on: string;
        service_band: string;
        days_granted: number;
        days_remaining: number;
        expires_on: string;
        rule_type: "manual";
        notes: string;
      };
    };

const CUTOVER_NOTE_PREFIX = "[cutover:";

function printUsage() {
  console.error("Uso:");
  console.error(
    "  tsx scripts/backfill-japan-vacation-grants.ts --cutover-date=YYYY-MM-DD [--apply] [--database-url=postgresql://...]"
  );
  console.error("");
  console.error("Requisitos:");
  console.error("  - DATABASE_URL en el entorno o --database-url");
  console.error("  - --cutover-date obligatorio");
  console.error("  - Por defecto corre en dry-run");
}

function parseArgs(argv: string[]): CliOptions {
  let apply = false;
  let cutoverDate: string | null = null;
  let databaseUrl: string | null = null;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg.startsWith("--cutover-date=")) {
      cutoverDate = arg.slice("--cutover-date=".length);
      continue;
    }

    if (arg.startsWith("--database-url=")) {
      databaseUrl = arg.slice("--database-url=".length);
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Argumento no soportado: ${arg}`);
  }

  const resolvedDatabaseUrl = databaseUrl ?? process.env.DATABASE_URL ?? null;

  if (!cutoverDate || !/^\d{4}-\d{2}-\d{2}$/.test(cutoverDate)) {
    throw new Error("Debes indicar --cutover-date=YYYY-MM-DD");
  }

  if (!resolvedDatabaseUrl) {
    throw new Error("Debes definir DATABASE_URL o pasar --database-url");
  }

  return {
    apply,
    cutoverDate,
    databaseUrl: resolvedDatabaseUrl,
  };
}

function parseIsoDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcYears(date: Date, years: number) {
  const result = new Date(date.getTime());
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

function buildCutoverNote(cutoverDate: string) {
  return `${CUTOVER_NOTE_PREFIX}${cutoverDate}] Initial manual grant from legacy num_vacations`;
}

function decideBackfill(user: BackfillUserRow, cutoverDate: string, existingGrant: ExistingGrantRow | null): BackfillDecision {
  if (existingGrant) {
    return { action: "skip", reason: "already_backfilled" };
  }

  if (user.is_active === false) {
    return { action: "skip", reason: "inactive_user" };
  }

  if (!user.hire_date) {
    return { action: "skip", reason: "missing_hire_date" };
  }

  const legacyBalance = Number(user.num_vacations ?? 0);
  if (!(legacyBalance > 0)) {
    return { action: "skip", reason: "non_positive_legacy_balance" };
  }

  return {
    action: "insert",
    grant: {
      user_id: user.id,
      granted_on: cutoverDate,
      service_band: resolveJapanServiceBand(user.hire_date, cutoverDate) ?? "6_months",
      days_granted: legacyBalance,
      days_remaining: legacyBalance,
      expires_on: formatIsoDate(addUtcYears(parseIsoDate(cutoverDate), 2)),
      rule_type: "manual",
      notes: buildCutoverNote(cutoverDate),
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const client = new Client({
    connectionString: options.databaseUrl,
    ssl: options.databaseUrl.includes("localhost") || options.databaseUrl.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });

  const summary = {
    totalUsers: 0,
    eligibleUsers: 0,
    inserted: 0,
    wouldInsert: 0,
    skipped: {
      already_backfilled: 0,
      inactive_user: 0,
      missing_hire_date: 0,
      non_positive_legacy_balance: 0,
    } as Record<SkipReason, number>,
  };

  await client.connect();

  try {
    console.error(
      options.apply
        ? `Backfill Japan vacation grants en modo APPLY para corte ${options.cutoverDate}`
        : `Backfill Japan vacation grants en modo DRY-RUN para corte ${options.cutoverDate}`
    );

    if (options.apply) {
      await client.query("begin");
    }

    const usersResult = await client.query<BackfillUserRow>(`
      select
        id,
        email,
        name,
        hire_date::text,
        weekly_days,
        weekly_hours,
        attendance_eligible,
        num_vacations,
        is_active
      from public.users
      order by coalesce(name, email, id::text)
    `);

    summary.totalUsers = usersResult.rows.length;

    for (const user of usersResult.rows) {
      const existingGrantResult = await client.query<ExistingGrantRow>(
        `
          select id
          from public.vacation_grants
          where user_id = $1
            and notes = $2
          limit 1
        `,
        [user.id, buildCutoverNote(options.cutoverDate)]
      );

      const decision = decideBackfill(
        user,
        options.cutoverDate,
        existingGrantResult.rows[0] ?? null
      );

      if (decision.action === "skip") {
        summary.skipped[decision.reason] += 1;
        continue;
      }

      summary.eligibleUsers += 1;

      if (options.apply) {
        await client.query(
          `
            insert into public.vacation_grants (
              user_id,
              granted_on,
              service_band,
              days_granted,
              days_remaining,
              expires_on,
              rule_type,
              notes
            ) values ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            decision.grant.user_id,
            decision.grant.granted_on,
            decision.grant.service_band,
            decision.grant.days_granted,
            decision.grant.days_remaining,
            decision.grant.expires_on,
            decision.grant.rule_type,
            decision.grant.notes,
          ]
        );
        summary.inserted += 1;
      } else {
        summary.wouldInsert += 1;
      }

      const userLabel = user.name ?? user.email ?? user.id;
      console.error(
        `${options.apply ? "INSERT" : "WOULD INSERT"} ${userLabel} -> ${decision.grant.days_granted} dias (${decision.grant.granted_on})`
      );
    }

    if (options.apply) {
      await client.query("commit");
    }

    console.error("");
    console.error("Resumen");
    console.error(`  Usuarios revisados: ${summary.totalUsers}`);
    console.error(`  Usuarios elegibles: ${summary.eligibleUsers}`);
    console.error(`  Grants ${options.apply ? "insertados" : "a insertar"}: ${options.apply ? summary.inserted : summary.wouldInsert}`);
    console.error(`  Saltados por ya backfilleado: ${summary.skipped.already_backfilled}`);
    console.error(`  Saltados por inactivos: ${summary.skipped.inactive_user}`);
    console.error(`  Saltados por hire_date faltante: ${summary.skipped.missing_hire_date}`);
    console.error(`  Saltados por saldo legacy <= 0: ${summary.skipped.non_positive_legacy_balance}`);
  } catch (error) {
    if (options.apply) {
      await client.query("rollback");
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("");
  console.error("Error en backfill de grants Japón:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
