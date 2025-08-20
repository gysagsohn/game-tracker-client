// src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthedShell from "./components/AuthedShell";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./contexts/AuthProvider"; // ✅ provider component
import CheckEmailPage from "./pages/CheckEmail";
import Dashboard from "./pages/Dashboard";
import ForgotPasswordPage from "./pages/ForgotPassword";
import Login from "./pages/Login";
import OAuthSuccess from "./pages/OAuthSuccess";
import ProfilePage from "./pages/Profile";
import Signup from "./pages/Signup";
import VerifyEmailPage from "./pages/VerifyEmail";

export default function App() {
  return (
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
              <Route path="/profile/me" element={<ProfilePage />} />
              {/* TODO: /matches/new, /matches, /profile/:id */}
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<div className="p-6">Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
