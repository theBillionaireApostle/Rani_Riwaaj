// app/signin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  signInWithPopup,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../firebaseClient";
import { Poppins } from "next/font/google";
import { Eye, EyeOff } from "lucide-react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

export default function SignInPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitialLoading(false);
    });
    return () => unsub();
  }, []);

  // Create or update user record in our database when auth state changes
  useEffect(() => {
    if (!user) return;
    const createOrUpdateUser = async () => {
      try {
        const baseURL = "https://rani-riwaaj-backend-ylbq.vercel.app";
        await fetch(`${baseURL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL || null,
          }),
        });
      } catch (err) {
        console.error("Failed to sync user with DB:", err);
      }
    };
    createOrUpdateUser();
  }, [user]);

  useEffect(() => {
    if (user) {
      const timer = setInterval(() => {
        setRedirectCountdown((c) => c - 1);
      }, 1000);
      const timeout = setTimeout(() => {
        router.push("/");
      }, 5000);
      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [user, router]);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      setError("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Email is required.");
    if (password.length < 6) return setError("Password must be ≥ 6 chars.");
    if (mode === "signup" && password !== confirmPwd) {
      return setError("Passwords must match.");
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code?.includes("auth/email-already-in-use")) {
        setError("Email already in use.");
      } else if (err.code?.includes("auth/invalid-email")) {
        setError("Invalid email address.");
      } else if (err.code?.includes("auth/wrong-password")) {
        setError("Wrong password.");
      } else {
        setError("Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className={`${poppins.className} signin-container`}>
        <div className="loader">Loading...</div>
        <style jsx>{`
          .signin-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f0f0f0;
          }
          .loader {
            font-size: 1.2rem;
            color: #333;
          }
        `}</style>
      </div>
    );
  }

  if (user) {
    const name = user.displayName || user.email?.split("@")[0] || "User";
    return (
      <div className={`${poppins.className} signin-container`}>
        <div className="card success">
          <h1>Welcome, {name}!</h1>
          <p>You are signed in.</p>
          <p>Redirecting in {redirectCountdown}...</p>
        </div>
        <style jsx>{`
          .signin-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #e8f5e9;
          }
          .card.success {
            background: #fff;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #2e7d32; }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`${poppins.className} signin-container`}>
      <div className="card">
        <div className="toggle">
          <button
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
          >
            Sign In
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>
        <h1>{mode === "signin" ? "Welcome Back" : "Create Account"}</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleEmailAuth}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="pw-wrapper">
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === "signup" && (
            <>
              <label>Confirm Password</label>
              <div className="pw-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn primary">
            {loading
              ? mode === "signin"
                ? "Signing In..."
                : "Signing Up..."
              : mode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>
        <div className="divider">OR</div>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-60"
        >
          <Image
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            width={20}
            height={20}
          />
          {loading ? 'Please wait…' : 'Sign up with Google'}
        </button>
      </div>

      <style jsx>{`
        .signin-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          min-height: 100vh;
          background: linear-gradient(135deg, #e3f2fd 0%, #b3e5fc 100%);
        }
        .card {
          background: #fff;
          border-radius: 12px;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          text-align: center;
        }
        .toggle {
          display: flex;
          margin-bottom: 1rem;
          background: #f0f0f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .toggle button {
          flex: 1;
          padding: 0.5rem 0;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
        }
        .toggle .active {
          background: #0288d1;
          color: #fff;
        }
        h1 {
          margin-bottom: 1rem;
          color: #333;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        label {
          text-align: left;
          font-size: 0.9rem;
          color: #555;
        }
        input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 1rem;
          width: 100%;
        }
        .pw-wrapper {
          position: relative;
        }
        .pw-wrapper button {
          position: absolute;
          top: 50%;
          right: 0.5rem;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
        }
        .btn {
          margin-top: 1rem;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease;
          width: 100%;
        }
        .btn.primary {
          background: #0288d1;
          color: #fff;
        }
        .btn.primary:hover:not(:disabled) {
          background: #0277bd;
          transform: translateY(-2px);
        }
        .btn.google {
          background: #db4437;
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          gap: 0.5rem;
          border-radius: 6px;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .btn.google:hover:not(:disabled) {
          background: #c33c2e;
          transform: translateY(-2px);
        }
        /* ensure transparent logo scales nicely */
        .google-logo {
          width: 20px;
          height: 20px;
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .divider {
          margin: 1rem 0;
          position: relative;
          font-size: 0.9rem;
          color: #888;
        }
        .divider::before,
        .divider::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #ccc;
        }
        .divider::before {
          left: 0;
        }
        .divider::after {
          right: 0;
        }
        .error {
          color: #e53935;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}
