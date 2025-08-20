import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../contexts/useAuth";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/matches", label: "Matches" },
  { to: "/friends", label: "Friends" },
  { to: "/profile/me", label: "Profile" },
];

export default function SideNav() {
  const { logout } = useAuth();

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