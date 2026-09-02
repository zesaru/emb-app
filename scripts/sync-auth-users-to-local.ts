#!/usr/bin/env tsx

import { createClient, type User } from "@supabase/supabase-js";

const productionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const productionServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const localUrl = process.env.LOCAL_SUPABASE_URL;
const localServiceKey = process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY;
const temporaryPassword = process.env.LOCAL_TEMP_PASSWORD || "LocalEmb2026!";
const targetEmail = "cmurillo@embperujapan.org";

if (!productionUrl || !productionServiceKey || !localUrl || !localServiceKey) {
  throw new Error(
    "Requiere NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LOCAL_SUPABASE_URL y LOCAL_SUPABASE_SERVICE_ROLE_KEY",
  );
}

if (!/^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(localUrl) && !/^https?:\/\/localhost(?::\d+)?$/.test(localUrl)) {
  throw new Error("LOCAL_SUPABASE_URL debe apuntar a localhost o 127.0.0.1");
}

const production = createClient(productionUrl, productionServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const local = createClient(localUrl, localServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const users: User[] = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await production.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`No se pudieron leer usuarios de producción: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }

  let created = 0;
  let existing = 0;
  let targetFound = false;

  for (const user of users) {
    const email = user.email ?? undefined;
    if (email?.toLowerCase() === targetEmail) targetFound = true;

    const { data: localUser } = await local.auth.admin.getUserById(user.id);
    if (localUser.user) {
      existing += 1;
      if (email?.toLowerCase() === targetEmail) {
        const { error } = await local.auth.admin.updateUserById(user.id, { password: temporaryPassword });
        if (error) throw new Error(`No se pudo restablecer el usuario local objetivo: ${error.message}`);
      }
      continue;
    }

    const { error } = await local.auth.admin.createUser({
      id: user.id,
      email,
      phone: user.phone ?? undefined,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    });
    if (error) throw new Error(`No se pudo crear ${email ?? user.id} localmente: ${error.message}`);
    created += 1;
  }

  console.log(JSON.stringify({
    productionReadOnly: true,
    usersRead: users.length,
    created,
    existing,
    targetFound,
    targetEmail,
    temporaryPassword,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
