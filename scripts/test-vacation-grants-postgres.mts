/**
 * Isolated PostgreSQL integration checks with synthetic records only.
 * Usage: VACATION_CRON_TEST_DATABASE_URL=... node --import tsx scripts/test-vacation-grants-postgres.mts
 * The caller must obtain the AGENTS.md exception for a new disposable instance.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { planAutomaticVacationGrants } from "../lib/vacations/automatic-grants";

const url = process.env.VACATION_CRON_TEST_DATABASE_URL;
if (!url) throw new Error("VACATION_CRON_TEST_DATABASE_URL is required");
const target = new URL(url);
if (!["127.0.0.1", "localhost"].includes(target.hostname) || target.pathname !== "/emb_vacation_cron_test" || target.port === "55422") {
  throw new Error("Only the dedicated disposable local test database is allowed");
}
const db = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000 });
const migration = fs.readFileSync(new URL("../supabase/migrations/20261015014736_move_vacation_grants_to_postgres.sql", import.meta.url), "utf8");
const user = (overrides = {}) => ({
  id: randomUUID(), hire_date: "2024-04-01", weekly_days: 5, weekly_hours: 40,
  attendance_eligible: null, grant_mode: "automatic", num_vacations: 0,
  is_active: true, is_diplomatic: false, ...overrides,
});
type TestUser = ReturnType<typeof user>;
let passed = 0;
async function check(name: string, fn: () => Promise<void>) {
  await db.query("BEGIN");
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  finally { await db.query("ROLLBACK"); }
}
async function addUser(u: TestUser) {
  await db.query("INSERT INTO public.users(id,hire_date,weekly_days,weekly_hours,attendance_eligible,grant_mode,num_vacations,is_active,is_diplomatic) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", Object.values(u));
}
async function addGrant(id: string, date: string, rule = "standard", days = 10, expiry: string | null = null) {
  await db.query("INSERT INTO public.vacation_grants(user_id,granted_on,service_band,days_granted,days_remaining,expires_on,rule_type) VALUES($1,$2,'6_months',$3,$3,coalesce($4::date,($2::date+interval '2 years')::date),$5)",[id,date,days,expiry,rule]);
}
const run = async (dryRun = true, at = "2026-10-15T00:00:00Z") =>
  (await db.query("SELECT private.run_vacation_grants($1,$2) AS result",[dryRun,at])).rows[0].result;

try {
  await db.connect();
  const count = (await db.query("SELECT count(*)::int AS count FROM pg_tables WHERE schemaname IN ('public','private')")).rows[0].count;
  assert.equal(count, 0, "Test database must initially be empty; never reuse an existing environment");
  await db.query(`
    do $$ begin
      if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
    end $$;
    create table public.users (
      id uuid primary key, hire_date date, weekly_days smallint, weekly_hours numeric,
      attendance_eligible boolean, grant_mode text, num_vacations integer,
      is_active boolean, is_diplomatic boolean
    );
    create table public.vacation_grants (
      id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id),
      granted_on date not null, service_band text not null, days_granted numeric not null,
      days_remaining numeric not null check(days_remaining between 0 and days_granted),
      expires_on date not null check(expires_on >= granted_on), rule_type text not null, notes text
    );
    create unique index vacation_grants_unique_legal_milestone_idx on public.vacation_grants(user_id,granted_on,service_band)
      where rule_type in ('standard','proportional');
  `);
  await db.query(migration);

  await check("standard and proportional tables match TypeScript across every service band", async () => {
    for (const weekly of [1,2,3,4,5]) for (let band = 0; band <= 6; band++) {
      const u = user({ weekly_days: weekly, weekly_hours: weekly === 5 ? 40 : weekly * 6 });
      await addUser(u);
      const date = (await db.query("SELECT private.vacation_grant_anniversary('2024-04-01', $1)::text AS date",[band])).rows[0].date;
      if (band > 0) {
        const previous = (await db.query("SELECT private.vacation_grant_anniversary('2024-04-01', $1)::text AS date",[band-1])).rows[0].date;
        await addGrant(u.id, previous);
      }
      const history = (await db.query("SELECT user_id,granted_on::text,rule_type FROM public.vacation_grants WHERE user_id=$1",[u.id])).rows;
      const expected = planAutomaticVacationGrants(u,history,date);
      const actual = (await db.query("SELECT * FROM private.plan_vacation_grants($1,$2)",[date,u.id])).rows[0];
      assert.equal(actual.status, expected.status);
      assert.equal(expected.status, "ready");
      if (expected.status === "ready") {
        const { notes: _notes, ...terms } = expected.grants[0];
        const { notes: _sqlNotes, ...sqlTerms } = actual.grants[0];
        assert.deepEqual(sqlTerms, terms);
      }
    }
  });
  await check("Tokyo midnight, first grant, and two-year expiry", async () => {
    const u = user(); await addUser(u);
    assert.equal((await run(true,"2024-09-30T14:59:59Z")).wouldIssue,0);
    const result = await run(false,"2024-09-30T15:00:00Z");
    assert.equal(result.processedAt,"2024-10-01"); assert.equal(result.issued,1);
    const row = (await db.query("SELECT expires_on::text,days_remaining::integer FROM public.vacation_grants")).rows[0];
    assert.deepEqual(row,{expires_on:"2026-10-01",days_remaining:10});
  });
  await check("leap years return to February 29 from the original hire date", async () => {
    assert.equal((await db.query("SELECT private.vacation_grant_anniversary('2023-08-31',4)::text AS day")).rows[0].day,"2028-02-29");
  });
  await check("dry run creates no audit or grant", async () => {
    const u = user(); await addUser(u);
    const snapshot = await run(true,"2026-10-01T00:00:00Z");
    assert.equal(snapshot.wouldIssue,3); assert.equal(snapshot.issued,0);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM private.vacation_grant_job_runs")).rows[0].n,0);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.vacation_grants")).rows[0].n,0);
  });
  await check("missed anniversaries are recovered in order and a repeated run cannot duplicate", async () => {
    const u = user(); await addUser(u); await addGrant(u.id,"2024-10-01");
    const result = await run(false); assert.equal(result.issued,2);
    assert.equal((await run(false)).issued,0);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.vacation_grants")).rows[0].n,3);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM private.vacation_grant_job_runs")).rows[0].n,2);
  });
  await check("reconciled balances and explicit historic expiries are preserved", async () => {
    const u = user(); await addUser(u);
    await addGrant(u.id,"2026-04-01","manual",9,"2027-10-01");
    await addGrant(u.id,"2026-10-01","standard",12,"2028-10-01");
    const before = (await db.query("SELECT to_jsonb(g) AS row FROM public.vacation_grants g ORDER BY id")).rows;
    assert.equal((await run(false)).issued,0);
    assert.deepEqual((await db.query("SELECT to_jsonb(g) AS row FROM public.vacation_grants g ORDER BY id")).rows,before);
    const next = await run(true,"2027-10-01T00:00:00Z"); assert.equal(next.wouldIssue,1);
  });
  await check("manual, inactive, diplomatic, attendance and incomplete cases remain protected", async () => {
    const cases = [
      { grant_mode:"manual" },{is_active:false},{is_diplomatic:true},{attendance_eligible:false},
      {hire_date:null},{weekly_days:null,weekly_hours:null},{num_vacations:9},
    ];
    for(const c of cases) await addUser(user(c));
    const result = await run(false); assert.equal(result.issued,0); assert.equal(result.blocked,4);
  });
  await check("manual cutovers and expired historical gaps require reconciliation", async () => {
    const u = user(); await addUser(u); await addGrant(u.id,"2026-04-01","manual");
    assert.equal((await run()).reasons.reconciliation_required,1);
    await db.query("DELETE FROM public.vacation_grants");
    assert.equal((await run(true,"2026-10-02T00:00:00Z")).reasons.historical_gap,1);
  });
  await check("a writing failure rolls back all new grants and its successful-run audit", async () => {
    const u = user(); await addUser(u); await addGrant(u.id,"2024-10-01");
    await db.query(`create function private.test_fail_grant() returns trigger language plpgsql as $$ begin
      if new.granted_on='2026-10-01' then raise exception 'synthetic failure'; end if; return new; end $$;
      create trigger test_fail before insert on public.vacation_grants for each row execute function private.test_fail_grant()`);
    await db.query("SAVEPOINT expected_failure");
    await assert.rejects(run(false));
    await db.query("ROLLBACK TO SAVEPOINT expected_failure");
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.vacation_grants")).rows[0].n,1);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM private.vacation_grant_job_runs")).rows[0].n,0);
  });
  await check("application roles cannot execute internal routines or read the private audit", async () => {
    for(const role of ["anon","authenticated","service_role"]) {
      const row = (await db.query("SELECT has_function_privilege($1,'private.run_vacation_grants(boolean,timestamp with time zone)','EXECUTE') AS execute, has_table_privilege($1,'private.vacation_grant_job_runs','SELECT') AS read",[role])).rows[0];
      assert.deepEqual(row,{execute:false,read:false});
    }
    assert.equal((await db.query("SELECT prosecdef FROM pg_proc WHERE oid='private.run_vacation_grants(boolean,timestamp with time zone)'::regprocedure")).rows[0].prosecdef,false);
  });
  await check("an overlapping execution exits before issuing grants", async () => {
    const other = new pg.Client({ connectionString: url, connectionTimeoutMillis: 10000 });
    try {
      await db.query("SELECT pg_advisory_xact_lock(1870191,1)");
      await other.connect();
      const result = (await other.query("SELECT private.run_vacation_grants(false) AS result")).rows[0].result;
      assert.deepEqual(result,{success:true,skipped:true,reason:"already_running"});
    } finally { await other.end(); }
  });
  // A read-only transaction must work even though the same routine can write
  // when called explicitly with false. No synthetic fixtures are needed here.
  await db.query("BEGIN READ ONLY");
  await run(true);
  await db.query("ROLLBACK"); passed++;
  console.log(`${passed} PostgreSQL integration checks passed; synthetic fixture transactions rolled back.`);
} finally { await db.end(); }
