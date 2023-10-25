import { MobileSidebar } from "./mobile-sidebar";
import { UserNav } from "./user-nav";

const Navbar = () => {
    return (
        <div className="p-4 border-b h-full flex justify-between items-center bg-white shadow-sm">
          <MobileSidebar />
          <UserNav/>
        </div>
      );
}
 
export default Navbar;