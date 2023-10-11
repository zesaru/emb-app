'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { type CompensatorysWithUser } from "@/types/collections";
import { DataTable } from "./data-table"
import { columns } from "./columns"

const Compensatorios = () => {
  const supabase = createClientComponentClient()
  const [compensatorys, setCompensatorys] = useState<CompensatorysWithUser[]>([])

  useEffect(() => {
    const getUsers = async () => {

      const { data, error } = await supabase.from('compensatorys').select('*')

      if (data) {
        setCompensatorys(data)
      }
    }

    getUsers()
  }, [supabase, setCompensatorys])



  return (
    <div className="flex flex-col">
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={compensatorys} />
    </div>
</div>
  )
}

export default Compensatorios