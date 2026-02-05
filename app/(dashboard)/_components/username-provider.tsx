"use client"

import { useEffect } from "react"
import { usePersonStore } from "@/store"

interface UserNameProviderProps {
  children: React.ReactNode
  initialUserName: string
}

export function UserNameProvider({ children, initialUserName }: UserNameProviderProps) {
  const setUserName = usePersonStore(state => state.setUserName)

  useEffect(() => {
    if (initialUserName) {
      setUserName(initialUserName)
    }
  }, [initialUserName, setUserName])

  return <>{children}</>
}
