'use client'

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { type CompensatorysEntity } from "@/types/collections";
import { DataTable } from "./data-table"
import { columns } from "./columns"

const Compensatorios = () => {
  const supabase = createClientComponentClient()
  const [compensatorys, setCompensatorys] = useState<CompensatorysEntity[]>([])

  useEffect(() => {
    const getUsers = async () => {

      const { data } = await supabase.from('compensatorys').select('*')
      if (data) {
        setCompensatorys(data)
      }
    }

    getUsers()
  }, [supabase, setCompensatorys])

  console.log(compensatorys)

  return (
    <div className="flex flex-col">
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={compensatorys} />
    </div>
</div>
  )
}

export default Compensatorios