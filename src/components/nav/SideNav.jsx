import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import { fetchNotifications } from "../../lib/api/notifications";
import { MdDashboard, MdSportsEsports, MdPeople, MdPerson, MdNotifications } from "react-icons/md";
import LogoutButton from "../ui/LogoutButton";


const links = [
  { to: "/dashboard", label: "Dashboard", icon: <MdDashboard size={20} /> },
  { to: "/matches", label: "Matches", icon: <MdSportsEsports size={20} /> },
  { to: "/friends", label: "Friends", icon: <MdPeople size={20} /> },
  { to: "/profile/me", label: "Profile", icon: <MdPerson size={20} /> },
];

export default function SideNav() {
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
    <aside 
      className="hidden md:flex h-[90vh] min-w-64 flex-col justify-between pt-8 px-4 rounded-2xl shadow-card"
      style={{
        background: "var(--color-card)",
        border: "1px solid color-mix(in oklab, var(--color-border-muted) 40%, transparent)"
      }}
    >
      <div>
        {/* Logo */}
        <Link 
          to="/dashboard" 
          className="mb-10 inline-block transition-transform hover:scale-105"
        >
          <img src={logo} alt="Game Tracker" className="h-20 w-auto" title="Home" />
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[color-mix(in oklab,var(--color-cta)_12%,white)] text-[var(--color-cta)] shadow-sm"
                    : "text-[var(--color-secondary)] hover:bg-[color-mix(in oklab,var(--color-border-muted)_25%,white)] hover:text-[var(--color-primary)]"
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}

        {/* Notifications Link with Badge */}
          <NavLink
            to="/notifications"
            aria-label="Notifications"
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[color-mix(in oklab,var(--color-cta)_12%,white)] text-[var(--color-cta)] shadow-sm"
                  : "text-[var(--color-secondary)] hover:bg-[color-mix(in oklab,var(--color-border-muted)_25%,white)] hover:text-[var(--color-primary)]"
              }`
            }
          >
            <MdNotifications size={20} />
            <span>Notifications</span>
            {unread > 0 && (
              <span
                aria-label={`${unread} unread notifications`}
                className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-[var(--color-warning)] text-white"
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </NavLink>
        </nav>
      </div>

      {/* Logout Button */}
      <div className="mb-6">
        <LogoutButton fullWidth />
      </div>
    </aside>
  );
}