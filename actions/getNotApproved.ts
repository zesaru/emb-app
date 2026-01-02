import { createClient } from "@/utils/supabase/server";


export const dynamic = "force-dynamic";

const GetNotApproved = async () => {
  const supabase = createClient();

  const {data } = await supabase.rpc("count_unapproved_records");

  return (data as any) || [];
};

export default GetNotApproved;
