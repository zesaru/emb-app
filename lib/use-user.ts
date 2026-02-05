"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { usePersonStore } from "@/store"

export function useUserName() {
  const [userName, setUserNameState] = useState<string>("Usuario")
  const setUserName = usePersonStore(state => state.setUserName)

  useEffect(() => {
    async function loadUserName() {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.id) {
          const { data } = await supabase
            .from('users')
            .select('name')
            .eq('id', user.id)
            .single()

          if (data?.name) {
            setUserName(data.name)
            setUserNameState(data.name)
          }
        }
      } catch (error) {
        console.error("Error loading user name:", error)
      }
    }

    loadUserName()
  }, [setUserName])

  return userName
}
