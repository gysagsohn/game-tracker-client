import { useAuth } from "../../contexts/useAuth";

export default function LogoutButton({ className = "", fullWidth = false }) {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className={`btn ${fullWidth ? "w-full justify-center" : "inline-flex justify-center"} text-sm py-3 transition-all duration-200 ${className}`}
      style={{
        background: "color-mix(in oklab, var(--color-warning) 10%, white)",
        color: "var(--color-warning)",
        border: "1px solid color-mix(in oklab, var(--color-warning) 30%, transparent)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "color-mix(in oklab, var(--color-warning) 15%, white)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "color-mix(in oklab, var(--color-warning) 10%, white)";
      }}
    >
      Logout
    </button>
  );
}
