// Sends email through Microsoft 365 (Graph API, client-credentials app-only
// auth) on behalf of the app. Only reachable from our own Next.js server:
// besides Supabase's default JWT check, callers must also present the
// x-internal-token header matching INTERNAL_FUNCTION_SECRET -- otherwise any
// logged-in app user could hit this URL directly and send mail as the
// organization mailbox.

interface SendEmailPayload {
  to: string[];
  subject: string;
  html: string;
}

function isSendEmailPayload(value: unknown): value is SendEmailPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.to) &&
    v.to.length > 0 &&
    v.to.every((entry) => typeof entry === "string" && entry.trim().length > 0) &&
    typeof v.subject === "string" &&
    typeof v.html === "string"
  );
}

async function getGraphAccessToken(tenantId: string, clientId: string, clientSecret: string) {
  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to obtain Graph access token (${response.status}): ${body}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

async function sendMailViaGraph(
  accessToken: string,
  sender: string,
  payload: SendEmailPayload,
) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: payload.subject,
          body: { contentType: "HTML", content: payload.html },
          toRecipients: payload.to.map((address) => ({ emailAddress: { address } })),
        },
        saveToSentItems: false,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Graph sendMail failed (${response.status}): ${body}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedToken = req.headers.get("x-internal-token");
  if (!internalSecret || providedToken !== internalSecret) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isSendEmailPayload(payload)) {
    return new Response(
      JSON.stringify({ success: false, error: "Expected { to: string[], subject: string, html: string }" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const tenantId = Deno.env.get("M365_TENANT_ID");
  const clientId = Deno.env.get("M365_CLIENT_ID");
  const clientSecret = Deno.env.get("M365_CLIENT_SECRET");
  const sender = Deno.env.get("M365_SENDER");

  if (!tenantId || !clientId || !clientSecret || !sender) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing M365 configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const accessToken = await getGraphAccessToken(tenantId, clientId, clientSecret);
    await sendMailViaGraph(accessToken, sender, payload);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-email function failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
});
