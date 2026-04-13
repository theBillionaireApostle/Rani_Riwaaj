"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Eye,
  EyeOff,
  Laptop2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/error-utils";

interface ChangePasswordResponse {
  message?: string;
}

interface SessionInfo {
  expiresAt: number | null;
  name: string;
  role: string;
}

function decodeSession(): SessionInfo | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("admin_jwt");
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const parsed = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as {
      exp?: number;
      name?: string;
      role?: string;
      username?: string;
      email?: string;
    };

    return {
      expiresAt: parsed.exp ? parsed.exp * 1000 : null,
      name: parsed.name ?? parsed.username ?? parsed.email?.split("@")[0] ?? "Admin",
      role: parsed.role ?? "Admin",
    };
  } catch {
    return null;
  }
}

function formatSessionTime(value: number | null): string {
  if (!value) return "No expiry data";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    setSessionInfo(decodeSession());
  }, []);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return "Idle";
    if (newPassword.length < 8) return "Weak";
    if (newPassword.length < 12) return "Good";
    return "Strong";
  }, [newPassword]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("admin_jwt") || "";
      const response = await fetch(
        "https://rani-riwaaj-backend-ylbq.vercel.app/admin/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      if (!response.ok) {
        const { message }: ChangePasswordResponse = await response
          .json()
          .catch(() => ({}));
        throw new Error(message || "Failed to change password.");
      }

      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rr-admin-page">
      <div className="rr-admin-pageIntro">
        <div className="rr-admin-pageLead">
          <span className="rr-admin-kicker">Security</span>
          <h1 className="rr-admin-pageTitle">Settings</h1>
          <p className="rr-admin-pageDescription">
            Admin access and password control.
          </p>
        </div>
      </div>

      <div className="rr-admin-grid rr-admin-grid--2">
        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Change password</h2>
              <p className="rr-admin-panelText">
                Update the admin password.
              </p>
            </div>
            <span className="rr-admin-badge rr-admin-badge--info">{passwordStrength}</span>
          </div>

          <form className="rr-admin-grid" onSubmit={handleSubmit}>
            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Current password</span>
              <div className="rr-admin-inputShell">
                <input
                  className="rr-admin-input"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="rr-admin-iconButton rr-admin-inputAction"
                  onClick={() => setShowCurrent((value) => !value)}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="rr-admin-fieldHint">
                Use the current admin password tied to this secure session.
              </span>
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">New password</span>
              <div className="rr-admin-inputShell">
                <input
                  className="rr-admin-input"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="rr-admin-iconButton rr-admin-inputAction"
                  onClick={() => setShowNew((value) => !value)}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="rr-admin-fieldHint">
                Use at least 12 characters for stronger admin access.
              </span>
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Confirm new password</span>
              <div className="rr-admin-inputShell">
                <input
                  className="rr-admin-input"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="rr-admin-iconButton rr-admin-inputAction"
                  onClick={() => setShowConfirm((value) => !value)}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="rr-admin-fieldHint">
                Re-enter the new password exactly to prevent lockout.
              </span>
            </label>

            <div className="rr-admin-formActions">
              <button
                type="submit"
                className="rr-admin-button rr-admin-button--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="rr-admin-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
              </button>
            </div>
          </form>
        </article>

        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Security guidance</h2>
              <p className="rr-admin-panelText">
                Keep admin access clean, rotated, and limited to trusted devices.
              </p>
            </div>
            <ShieldCheck size={18} />
          </div>

          <div className="rr-admin-grid">
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Use unique credentials</h3>
                  <p className="rr-admin-listSubtitle">
                    Avoid reusing passwords from personal, shared, or storefront accounts.
                  </p>
                </div>
                <LockKeyhole size={18} />
              </div>
            </div>

            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Rotate after access changes</h3>
                  <p className="rr-admin-listSubtitle">
                    Update credentials whenever staff access changes, devices are replaced,
                    or admin access is delegated.
                  </p>
                </div>
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Keep sessions device-bound</h3>
                  <p className="rr-admin-listSubtitle">
                    Sign out after admin work on shared browsers and avoid leaving the panel open
                    on public networks.
                  </p>
                </div>
                <Eye size={18} />
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="rr-admin-grid rr-admin-grid--3">
        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Active session</h2>
              <p className="rr-admin-panelText">
                Current admin identity and secure session timing.
              </p>
            </div>
            <Laptop2 size={18} />
          </div>
          <div className="rr-admin-grid">
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">{sessionInfo?.name ?? "Admin"}</h3>
                  <p className="rr-admin-listSubtitle">{sessionInfo?.role ?? "Authenticated"}</p>
                </div>
                <span className="rr-admin-badge rr-admin-badge--success">Live</span>
              </div>
            </div>
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Session expiry</h3>
                  <p className="rr-admin-listSubtitle">
                    {formatSessionTime(sessionInfo?.expiresAt ?? null)}
                  </p>
                </div>
                <Clock3 size={18} />
              </div>
            </div>
          </div>
        </article>

        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Password posture</h2>
              <p className="rr-admin-panelText">
                Current draft quality and minimum security target.
              </p>
            </div>
            <LockKeyhole size={18} />
          </div>
          <div className="rr-admin-grid">
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Strength state</h3>
                  <p className="rr-admin-listSubtitle">
                    {passwordStrength === "Idle"
                      ? "No new password entered yet."
                      : `${passwordStrength} draft based on current input.`}
                  </p>
                </div>
                <span className="rr-admin-badge rr-admin-badge--info">{passwordStrength}</span>
              </div>
            </div>
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Recommended baseline</h3>
                  <p className="rr-admin-listSubtitle">
                    12+ characters with mixed words, symbols, and no reused phrases.
                  </p>
                </div>
                <ShieldCheck size={18} />
              </div>
            </div>
          </div>
        </article>

        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Recovery posture</h2>
              <p className="rr-admin-panelText">
                Practical actions to keep admin access controlled.
              </p>
            </div>
            <ShieldCheck size={18} />
          </div>
          <div className="rr-admin-grid">
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">After team changes</h3>
                  <p className="rr-admin-listSubtitle">
                    Rotate the admin password immediately after any access transfer.
                  </p>
                </div>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">On shared devices</h3>
                  <p className="rr-admin-listSubtitle">
                    Sign out once work is complete and avoid saving credentials in the browser.
                  </p>
                </div>
                <Eye size={18} />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
