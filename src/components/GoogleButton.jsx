
import googleLogo from "../assets/google-logo.svg";

export default function GoogleButton({ className = "" }) {
  const handleClick = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
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
