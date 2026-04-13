"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import styles from "./login.module.css";
import { getErrorMessage } from "@/lib/error-utils";

const BACKEND_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";
const COOKIE_MAX_AGE = 60 * 60 * 24;

function parseTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_jwt");
    if (!token) return;

    const expiresAt = parseTokenExpiry(token);
    if (expiresAt && Date.now() < expiresAt) {
      router.replace("/admin");
    }
  }, [router]);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const statusCopy = useMemo(
    () =>
      isOffline
        ? "Offline. Reconnect before signing in."
        : "Connection ready.",
    [isOffline]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!navigator.onLine) {
      setError("You are offline. Reconnect and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${BACKEND_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        token?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to sign in.");
      }

      if (!data.token) {
        throw new Error("Missing admin token in login response.");
      }

      localStorage.setItem("admin_jwt", data.token);
      document.cookie = `admin_jwt=${encodeURIComponent(
        data.token
      )}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
      setMessage("Access granted.");
      router.push("/admin");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.headerRow}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.brandMark}>RR</span>
            <span className={styles.brandCopy}>
              <strong>Rani Riwaaj</strong>
              <span>Admin</span>
            </span>
          </Link>

          <Link href="/" className={styles.storeLink}>
            Store
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className={styles.hero}>
          <span className={styles.eyebrow}>Restricted Access</span>
          <h1 className={styles.title}>Admin access</h1>
          <p className={styles.subtitle}>Enter your admin credentials to continue.</p>
        </div>

        <div className={styles.statusRow}>
          <span
            className={`${styles.statusPill} ${
              isOffline ? styles.statusDanger : styles.statusReady
            }`}
          >
            {isOffline ? <WifiOff size={14} /> : <ShieldCheck size={14} />}
            {statusCopy}
          </span>
          <span className={styles.metaText}>Live backend</span>
        </div>

        {error ? (
          <div className={`${styles.banner} ${styles.bannerDanger}`}>
            <WifiOff size={18} />
            <span>{error}</span>
          </div>
        ) : null}

        {message ? (
          <div className={`${styles.banner} ${styles.bannerSuccess}`}>
            <ShieldCheck size={18} />
            <span>{message}</span>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Username</span>
            <input
              className={styles.input}
              type="text"
              autoComplete="username"
              autoFocus
              placeholder="Admin username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Password</span>
            <div className={styles.passwordField}>
              <input
                className={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.toggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className={styles.formMeta}>
            <span className={styles.metaPill}>
              <LockKeyhole size={14} />
              Secure session
            </span>
            <span className={styles.metaPill}>Internal use only</span>
          </div>

          <button
            type="submit"
            className={styles.submit}
            disabled={isSubmitting || isOffline}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="rr-admin-spin" />
                Signing in
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Enter Admin
              </>
            )}
          </button>
        </form>

      </section>
    </main>
  );
}
