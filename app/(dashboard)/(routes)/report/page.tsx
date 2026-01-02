import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
import List from '../../_components/list'
import { redirect } from "next/navigation";

const Report = async () => {
  const supabase = createClient();

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