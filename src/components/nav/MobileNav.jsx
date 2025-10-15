import { useEffect, useState } from "react";
import { FaHome, FaListUl, FaPlusCircle, FaUser, FaUserFriends, FaBell } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { fetchNotifications } from "../../lib/api/notifications";

export default function MobileNav() {
  const [unread, setUnread] = useState(0);

    useEffect(() => {
      const onVis = () => {
        if (document.visibilityState === "visible") {
          fetchNotifications({ status: "unread", page: 1, limit: 1 })
            .then(res => setUnread(res?.meta?.unreadCount || 0))
            .catch(() => {});
        }
      };
      document.addEventListener("visibilitychange", onVis);
      return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

  const navItems = [
    { to: "/dashboard", icon: <FaHome />, label: "Home" },
    { to: "/matches/new", icon: <FaPlusCircle />, label: "New" },
    { to: "/matches", icon: <FaListUl />, label: "Matches" },
    { to: "/friends", icon: <FaUserFriends />, label: "Friends" },
    { to: "/notifications", icon: <FaBell />, label: "Alerts", highlight: unread > 0 },
    { to: "/profile/me", icon: <FaUser />, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-[--color-border-muted] shadow-card md:hidden">
      <ul className="flex justify-around py-2">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs ${
                  isActive
                    ? "text-[--color-cta]"
                    : item.highlight
                      ? "text-[--color-warning]" // highlight if unread
                      : "text-secondary"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
