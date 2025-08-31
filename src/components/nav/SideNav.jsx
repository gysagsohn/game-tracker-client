
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../contexts/useAuth";
import { fetchNotifications } from "../../lib/api/notifications";
 
 const links = [
   { to: "/dashboard", label: "Dashboard" },
   { to: "/matches", label: "Matches" },
   { to: "/friends", label: "Friends" },
   { to: "/profile/me", label: "Profile" },
 ];
 
 export default function SideNav() {
   const { logout } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchNotifications({ status: "unread", page: 1, limit: 1 });
        if (mounted) setUnread(res?.meta?.unreadCount || 0);
      } catch {
        // silent fail in nav
      }
    })();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications({ status: "unread", page: 1, limit: 1 })
          .then(res => setUnread(res?.meta?.unreadCount || 0))
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { mounted = false; document.removeEventListener("visibilitychange", onVis); };
  }, []);
 
   return (
     <aside className="hidden md:flex h-[90vh] min-w-56 flex-col justify-between pt-8 pl-4 pr-4">
       <div>
         <Link to="/dashboard" className="mb-8 inline-block">
           <img src={logo} alt="Game Tracker" className="h-20 w-auto" title="Home" />
         </Link>
 
         <nav className="flex flex-col gap-8">
           {links.map((link) => (
             <NavLink
               key={link.to}
               to={link.to}
               className={({ isActive }) =>
                 `${isActive ? "text-[--color-cta] font-semibold" : "text-secondary"} text-sm`
               }
             >
               {link.label}
             </NavLink>
           ))}
          {/* Notifications link with unread badge */}
          <NavLink
            to="/notifications"
            aria-label="Notifications"
            className={({ isActive }) =>
              `relative ${isActive ? "text-[--color-cta] font-semibold" : "text-secondary"} text-sm`
            }
          >
            <span className="inline-flex items-center gap-2">
            Notifications
            </span>
            {unread > 0 && (
              <span
                aria-label={`${unread} unread notifications`}
                className="absolute -right-3 -top-2 inline-flex items-center justify-center text-[10px] rounded-full px-2 py-0.5 bg-[var(--color-cta)] text-white"
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </NavLink>
         </nav>
       </div>
 
       <div className="mb-6">
         <button
           onClick={logout}
           className="btn-sm btn-primary text-sm py-2 px-3 w-1/2 justify-center"
         >
           Logout
         </button>
       </div>
     </aside>
   );
 }
