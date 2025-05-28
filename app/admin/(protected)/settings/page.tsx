

"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const { message } = await res.json().catch(() => ({}));
        throw new Error(message || "Failed to change password");
      }
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Admin Settings</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="inputGroup">
          <label>Current Password</label>
          <div className="passwordWrapper">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="toggleBtn"
              onClick={() => setShowCurrent((s) => !s)}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="inputGroup">
          <label>New Password</label>
          <div className="passwordWrapper">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="toggleBtn"
              onClick={() => setShowNew((s) => !s)}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="inputGroup">
          <label>Confirm New Password</label>
          <div className="passwordWrapper">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="toggleBtn"
              onClick={() => setShowConfirm((s) => !s)}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button type="submit" className="submitBtn" disabled={loading}>
          {loading ? "Updating..." : "Change Password"}
        </button>
      </form>

      <style jsx>{`
        .container {
          max-width: 400px;
          margin: 2rem auto;
          padding: 2rem;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          font-family: Poppins, sans-serif;
        }
        h1 {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
          color: #333;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .inputGroup label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 600;
          color: #555;
        }
        .passwordWrapper {
          position: relative;
        }
        input {
          width: 100%;
          padding: 0.5rem 2.5rem 0.5rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 1rem;
        }
        input:focus {
          outline: none;
          border-color: #007EA7;
          box-shadow: 0 0 0 3px rgba(0,126,167,0.2);
        }
        .toggleBtn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: #666;
        }
        .toggleBtn:focus {
          outline: none;
        }
        .submitBtn {
          padding: 0.75rem;
          background-color: #007EA7;
          color: #fff;
          font-weight: 600;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .submitBtn:hover:not(:disabled) {
          background-color: #005f85;
        }
        .submitBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
