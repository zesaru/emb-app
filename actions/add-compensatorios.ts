"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";

export const addPost = async (formData: FormData) => {
  const eventName = formData.get("event_name");
  const hours = formData.get("hours");
  const eventDate = formData.get("event_date");
  if (formData === null) return;

  const supabase = createServerActionClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) return;

  console.log(eventDate)

//   await supabase
//     .from("compensatorys")
//     .insert({
//       event_name: eventName,
//       hours: hours,
//       event_date: eventDate,
//       user_id: user.id,
//     });

  revalidatePath(`/?content=${formData.toString()}`);
};
