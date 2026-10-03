import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  client: null as SupabaseClient | null,
  deliveryFails: true,
  html: [] as string[],
}));

vi.mock("@/actions/admin/users/shared", () => ({
  requireAdminContext: async () => ({ supabase: testState.client, adminUserId: "local-integration-admin" }),
}));
vi.mock("@/lib/email/dev-email-outbox", () => ({
  sendOrCaptureEmail: async (input: { react: React.ReactElement }) => {
    if (testState.deliveryFails) throw new Error("Entrega simulada fallida");
    testState.html.push(await render(input.react));
    return { success: true, deliveryMode: "sent" };
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const runLocally = process.env.RUN_LOCAL_INVITATION_INTEGRATION === "1";

describe.skipIf(!runLocally)("invitación y recuperación con Supabase local", () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    for (const id of createdIds.splice(0)) {
      const profile = await testState.client!.from("users").delete().eq("id", id);
      expect(profile.error).toBeNull();
      const auth = await testState.client!.auth.admin.deleteUser(id);
      expect(auth.error).toBeNull();
    }
  });

  it("recupera un fallo de entrega sin duplicar Auth y conserva un enlace válido", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):/);
    expect(key).toBeTruthy();
    testState.client = createClient(url!, key!, { auth: { persistSession: false } });
    testState.deliveryFails = true;
    testState.html = [];
    process.env.EMAIL_DELIVERY_ENABLED = "true";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    const { createAdminUser } = await import("@/actions/admin/users/create-user");
    const email = `invite-local-${crypto.randomUUID()}@example.test`;
    const input = { email, name: "Invitación Local", role: "user" as const, provisioningMode: "invite" as const };

    const first = await createAdminUser(input);
    expect(first).toMatchObject({ success: false, state: "incomplete", emailMayHaveBeenSent: true });
    if (!first.userId) throw new Error("Auth no devolvió ID de recuperación");
    createdIds.push(first.userId);

    const { data: pending, error: pendingError } = await testState.client.from("users")
      .select("provisioning_status, is_active, invitation_sent_at")
      .eq("id", first.userId)
      .single();
    expect(pendingError).toBeNull();
    expect(pending).toMatchObject({ provisioning_status: "pending", is_active: false, invitation_sent_at: null });
    expect(testState.html).toHaveLength(0);

    const { error: staleError } = await testState.client.from("users")
      .update({ invitation_dispatch_started_at: new Date(Date.now() - 10 * 60_000).toISOString() })
      .eq("id", first.userId);
    expect(staleError).toBeNull();
    testState.deliveryFails = false;

    const second = await createAdminUser({ ...input, resumeUserId: first.userId });
    expect(second).toMatchObject({ success: true, state: "created", userId: first.userId });
    expect(testState.html).toHaveLength(1);

    const { data: ready, error: readyError } = await testState.client.from("users")
      .select("provisioning_status, is_active, invitation_sent_at")
      .eq("id", first.userId)
      .single();
    expect(readyError).toBeNull();
    expect(ready?.provisioning_status).toBe("ready");
    expect(ready?.is_active).toBe(true);
    expect(ready?.invitation_sent_at).toBeTruthy();

    const href = testState.html[0].match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/)?.[1]?.replaceAll("&amp;", "&");
    expect(href).toBeTruthy();
    const response = await fetch(href!, { redirect: "manual" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("http://localhost:3000/auth/complete-invite");
  });
});
