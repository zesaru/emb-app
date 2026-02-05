import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
import List from '../../_components/list'
import { redirect } from "next/navigation";

const Report = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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