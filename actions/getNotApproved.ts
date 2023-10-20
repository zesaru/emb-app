import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const GetNotApproved = async () => {
  const supabase = createServerComponentClient<Database>({
    cookies: cookies,
  });

  const {data } = await supabase.rpc("count_unapproved_records");

  return (data as any) || [];
};

export default GetNotApproved;
