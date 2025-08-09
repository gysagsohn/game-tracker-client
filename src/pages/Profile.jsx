import { useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <main className="py-4">
      <h1 className="h1 text-center mb-6">My Profile</h1>

      <div className="bg-card rounded-[var(--radius-standard)] shadow-card border border-[--color-border-muted]/60 p-4">
        <div className="text-sm">
          <div className="mb-2"><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</div>
          <div className="mb-6"><span className="font-medium">Email:</span> {user?.email}</div>
          <button className="btn btn-primary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </main>
  );
}
