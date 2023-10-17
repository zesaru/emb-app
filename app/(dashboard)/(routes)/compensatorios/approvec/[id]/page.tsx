import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CTable from "../_components/compensatory-table";
  

  export default async function Approvec({ params }: { params: { id: string } } ) {
    const supabase = createServerComponentClient<Database>({ cookies });
  
    const {
      data: { session },
    } = await supabase.auth.getSession();
  
    if (session === null) {
      redirect("/login");
    }

    const idcompensatory = params.id;
    return (
        <div className="space-y-6 p-5">
            <Card>
                <CardHeader>
                    <CardTitle>Compensatorios</CardTitle>
                    <CardDescription>APROBAR REGISTRO DE DÍAS COMPENSATORIOS</CardDescription>
                </CardHeader>
                <CardContent>
                    <CTable id={idcompensatory}/>
                </CardContent>
            </Card>
        </div>
    );

  }
  