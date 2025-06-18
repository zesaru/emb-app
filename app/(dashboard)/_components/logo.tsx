import Image from "next/image"
import { Building2, Flag, Users, Shield } from "lucide-react"

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="bg-gradient-to-br from-red-600 via-white to-red-600 p-3 rounded-xl shadow-lg border">
          <Building2 className="h-7 w-7 text-red-700" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xl text-gray-800">EmbApp</span>
      </div>
    </div>
  )


}