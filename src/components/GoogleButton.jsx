import googleLogo from "../assets/google-logo.svg";

function trimTrailingSlash(s = "") {
  return s.replace(/\/+$/, "");
}

export default function GoogleButton({ className = "" }) {
  const API = trimTrailingSlash(import.meta.env.VITE_API_URL || "");

  const handleClick = () => {
    if (!API) {
      // Failsafe: avoid crashing if env is missing
      console.error("VITE_API_URL is not defined");
      return;
    }
    // Optional: preserve current path for post-login redirect
    const redirect = encodeURIComponent(window.location.pathname || "/");
    window.location.href = `${API}/auth/google?redirect=${redirect}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full flex items-center justify-center gap-3 rounded-[var(--radius-standard)] border border-[--color-border-muted] bg-white py-3 text-sm font-medium shadow-sm transition duration-200 hover:bg-[#f8f9fa] hover:border-[#4285F4] hover:shadow-md active:scale-[0.98] ${className}`}
    >
      <img src={googleLogo} alt="" className="h-5 w-5" />
      <span className="text-[#5F6368]">Continue with Google</span>
    </button>
  );
}
