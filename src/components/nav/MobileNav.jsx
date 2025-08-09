import { FaHome, FaListUl, FaPlusCircle, FaUser, FaUserFriends } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", icon: <FaHome />, label: "Home" },
  { to: "/matches/new", icon: <FaPlusCircle />, label: "New" },
  { to: "/matches", icon: <FaListUl />, label: "Matches" },
  { to: "/friends", icon: <FaUserFriends />, label: "Friends" },
  { to: "/profile/me", icon: <FaUser />, label: "Profile" },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-[--color-border-muted] shadow-card md:hidden">
      <ul className="flex justify-around py-2">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs ${isActive ? "text-[--color-cta]" : "text-secondary"}`
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