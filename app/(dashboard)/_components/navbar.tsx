import LogoutButton from "@/components/LogoutButton";
import { LogOut } from "lucide-react";

const Navbar = () => {
    return (
        <div className="p-4 border-b h-full flex items-center bg-white shadow-sm">
          <LogOut/>
          <LogoutButton />
        </div>
      );
}
 
export default Navbar;