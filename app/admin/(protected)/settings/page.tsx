"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/error-utils";

interface ChangePasswordResponse {
  message?: string;
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return "Waiting";
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
                Keep admin access clean and controlled.
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
                    Avoid reusing passwords from personal or shared accounts.
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
                    Update credentials whenever staff access changes or devices are replaced.
                  </p>
                </div>
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="rr-admin-listItem">
              <div className="rr-admin-listHeader">
                <div>
                  <h3 className="rr-admin-listTitle">Keep sessions clean</h3>
                  <p className="rr-admin-listSubtitle">
                    Sign out after admin work on shared devices and browsers.
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
