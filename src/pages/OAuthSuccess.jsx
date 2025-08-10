// src/pages/OAuthSuccess.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const { search, hash } = useLocation();
  const nav = useNavigate();
  const [status, setStatus] = useState("init"); // init | saving | done | error

  const token = useMemo(() => {
    const fromHash = new URLSearchParams(String(hash).replace(/^#/, "")).get("token");
    const fromQuery = new URLSearchParams(search).get("token");
    return fromHash || fromQuery || "";
  }, [hash, search]);

  useEffect(() => {
    async function run() {
      try {
        if (!token) {
          setStatus("error");
          return;
        }
        setStatus("saving");
        // store token, AuthContext will hydrate /users/me
        localStorage.setItem("token", token);

        // tiny delay to let storage settle + give a visual tick
        setTimeout(() => {
          setStatus("done");
          nav("/dashboard", { replace: true });
        }, 150);
      } catch (e) {
        console.error("OAuthSuccess error:", e);
        setStatus("error");
      }
    }
    run();
  }, [token, nav]);

  return (
    <div className="min-h-screen grid place-items-center bg-default">
      <div className="card p-6 w-full max-w-sm text-center">
        {status === "init" && (
          <p className="text-secondary">Parsing sign‑in response…</p>
        )}
        {status === "saving" && (
          <p className="inline-flex items-center gap-2 text-secondary">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity=".25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
            Finishing sign‑in…
          </p>
        )}
        {status === "done" && <p>Signed in. Redirecting…</p>}
        {status === "error" && (
          <div>
            <p className="mb-2" style={{ color: "var(--color-warning)" }}>
              No token found. Please try signing in again.
            </p>
            <a href="/login" className="underline" style={{ color: "var(--color-cta)" }}>
              Back to login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
