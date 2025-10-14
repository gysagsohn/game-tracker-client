import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { useAuth } from "../contexts/useAuth";
import { useToast } from "../contexts/useToast";
import api from "../lib/axios";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  // Stats from backend
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Change password form
  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  // Delete account
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user stats
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user?._id) return;
      try {
        setLoadingStats(true);
        const res = await api.get(`/users/${user._id}/stats`);
        const payload = res.data?.data || res.data || {};
        if (!ignore) setStats(payload);
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        if (!ignore) setLoadingStats(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [user?._id]);

  // Initialize edit form when user loads
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  // Update profile
  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      toast.error("First and last name are required");
      return;
    }

    try {
      setEditLoading(true);
      await api.put(`/users/${user._id}`, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      toast.success("Profile updated!");
      // Refresh page to get updated user
      window.location.reload();
    } catch (e) {
      const msg = e?.message || "Failed to update profile";
      toast.error(msg);
      if (/401|unauthorized/i.test(msg)) {
        logout();
        nav("/login", { replace: true });
      }
    } finally {
      setEditLoading(false);
    }
  }

  // Change password
  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");

    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError("All fields are required");
      return;
    }

    if (pwForm.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("Passwords don't match");
      return;
    }

    try {
      setPwLoading(true);
      // Login with current password to verify
      await api.post("/auth/login", {
        email: user.email,
        password: pwForm.currentPassword,
      });

      // If login succeeds, we know current password is correct
      // Now we need to update the password via a password reset flow
      // For now, we'll show an error explaining this isn't implemented yet
      toast.info("Password change via profile is coming soon. Use 'Forgot Password' for now.");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e) {
      const msg = e?.message || "Failed to change password";
      if (/invalid credentials/i.test(msg)) {
        setPwError("Current password is incorrect");
      } else {
        setPwError(msg);
      }
    } finally {
      setPwLoading(false);
    }
  }

  // Delete account
  async function handleDeleteAccount() {
    if (!confirm("Are you absolutely sure? This will permanently delete your account and all your data. This cannot be undone.")) {
      return;
    }

    try {
      setDeleteLoading(true);
      await api.delete(`/users/${user._id}`);
      toast.success("Account deleted");
      logout();
      nav("/signup", { replace: true });
    } catch (e) {
      const msg = e?.message || "Failed to delete account";
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  return (
    <main className="py-2 lg:py-6">
      <h1 className="h1 text-center mb-6 lg:mb-10">My Profile</h1>

      <div className="grid gap-6 max-w-3xl mx-auto">
        {/* User Info Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
              <span className="text-secondary">Name</span>
              <span className="font-medium">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
              <span className="text-secondary">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
              <span className="text-secondary">Member since</span>
              <span className="font-medium">{joinDate}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-secondary">Account status</span>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{
                  background: "color-mix(in oklab, var(--color-success) 12%, white)",
                  border: "1px solid color-mix(in oklab, var(--color-success) 45%, transparent)",
                }}
              >
                Active
              </span>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
          {loadingStats ? (
            <div className="grid gap-3">
              <div className="h-4 w-32 bg-[--color-border-muted] rounded animate-pulse" />
              <div className="h-4 w-40 bg-[--color-border-muted] rounded animate-pulse" />
              <div className="h-4 w-36 bg-[--color-border-muted] rounded animate-pulse" />
            </div>
          ) : (
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
                <span className="text-secondary">Total Matches</span>
                <span className="font-medium text-lg">{stats?.totalMatches || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
                <span className="text-secondary">Wins</span>
                <span className="font-medium text-lg text-[--color-success]">
                  {stats?.wins || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
                <span className="text-secondary">Losses</span>
                <span className="font-medium text-lg text-[--color-warning]">
                  {stats?.losses || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[--color-border-muted]">
                <span className="text-secondary">Draws</span>
                <span className="font-medium text-lg">{stats?.draws || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-secondary">Most Played Game</span>
                <span className="font-medium">
                  {stats?.mostPlayedGame || "None yet"}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Edit Profile Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
          <form onSubmit={handleUpdateProfile} className="grid gap-4">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, firstName: e.target.value }))
              }
              required
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, lastName: e.target.value }))
              }
              required
            />
            <Button
              type="submit"
              loading={editLoading}
              disabled={editLoading}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          {pwError && (
            <div
              className="mb-4 rounded-[var(--radius-standard)] border p-3 text-sm"
              style={{
                borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
                background: "color-mix(in oklab, var(--color-warning) 10%, white)",
                color: "var(--color-warning)",
              }}
            >
              {pwError}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="grid gap-4">
            <Input
              label="Current Password"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              required
            />
            <Input
              label="New Password"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              required
            />
            <Button
              type="submit"
              loading={pwLoading}
              disabled={pwLoading}
              className="w-full sm:w-auto"
            >
              Update Password
            </Button>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card
          className="p-6"
          style={{
            borderColor: "color-mix(in oklab, var(--color-warning) 40%, transparent)",
          }}
        >
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-warning)" }}>
            Danger Zone
          </h2>
          <p className="text-sm text-secondary mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button
            onClick={() => setShowDeleteModal(true)}
            className="btn-warning"
            disabled={deleteLoading}
          >
            Delete Account
          </Button>
        </Card>

        {/* Logout Button */}
        <div className="text-center">
          <button onClick={logout} className="btn">
            Logout
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteModal(false)}
        >
          <Card
            className="p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-3">Delete Account?</h2>
            <p className="text-sm text-secondary mb-6">
              This will permanently delete your account, all your matches, and your stats. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAccount}
                className="btn-warning flex-1"
                loading={deleteLoading}
                disabled={deleteLoading}
              >
                Yes, Delete Forever
              </Button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn flex-1"
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}