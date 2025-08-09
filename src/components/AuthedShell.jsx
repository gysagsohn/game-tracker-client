import { Outlet } from "react-router-dom";
import MobileNav from "./nav/MobileNav";
import SideNav from "./nav/SideNav";

export default function AuthedShell() {
  return (
    <div className="min-h-dvh bg-default text-primary pb-16 md:pb-0">
      <div className="mx-auto max-w-7xl md:flex lg:px-8 lg:py-10 lg:space-y-8 md:space-y-0">
        {/* lg:py-10 adds more top/bottom space; lg:space-y-8 adds breathing room in vertical layouts */}
        <SideNav />
        <main className="flex-1 px-4 py-6 lg:py-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}