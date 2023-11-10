import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
export const dynamic = "force-dynamic";
import List from '../../_components/list'
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const Report = async () => {
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }
    
  return (
    <div className="flex flex-col">
      <div className="container mx-auto py-10">
        <List/>
    </div>
  </div>)
}

export default Report