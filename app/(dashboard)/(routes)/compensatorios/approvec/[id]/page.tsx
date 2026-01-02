import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CTable from "../_components/compensatory-table";
import getsCompensatorioById from "@/actions/getCompensatorioById";
import BtnAprobar from "../_components/btnAprobar";

export default async function Approvec({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session === null) {
    redirect("/login");
  }

  const idcompensatory = params.id;
  const compensatory = await getsCompensatorioById(idcompensatory);

  return (
    <div className="space-y-6 p-5">
      <Card>
        <CardHeader>
          <CardTitle>Compensatorios</CardTitle>
          <CardDescription>
            APROBAR REGISTRO DE DÍAS COMPENSATORIOS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CTable compensatory={compensatory} />
        </CardContent>
        <div className="flex justify-start px-8">
          <BtnAprobar compensatory={compensatory}/>
        </div>
      </Card>
    </div>
  );
}
