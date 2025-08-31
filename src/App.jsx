// src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthedShell from "./components/AuthedShell";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./contexts/AuthProvider";
import ToastProvider from "./contexts/ToastProvider";
import AddGamePage from "./pages/AddGame";
import CheckEmailPage from "./pages/CheckEmail";
import Dashboard from "./pages/Dashboard";
import ForgotPasswordPage from "./pages/ForgotPassword";
import FriendRequestsPage from "./pages/FriendRequests";
import FriendsPage from "./pages/Friends";
import Login from "./pages/Login";
import MatchDetail from "./pages/MatchDetail";
import MatchesPage from "./pages/Matches";
import NewMatchPage from "./pages/NewMatch";
import NotificationsPage from "./pages/Notifications";
import OAuthSuccess from "./pages/OAuthSuccess";
import ProfilePage from "./pages/Profile";
import Signup from "./pages/Signup";
import VerifyEmailPage from "./pages/VerifyEmail";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />


            {/* Private */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AuthedShell />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/matches/:id" element={<MatchDetail />} />
                <Route path="/matches/new" element={<NewMatchPage />} />
                <Route path="/games/new" element={<AddGamePage />} />
                <Route path="/friends" element={<FriendsPage />} />   
                <Route path="/friends/requests" element={<FriendRequestsPage />} />
                <Route path="/profile/me" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                {/* TODO: /matches/new, /matches, /profile/:id */}
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<div className="p-6">Not Found</div>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
