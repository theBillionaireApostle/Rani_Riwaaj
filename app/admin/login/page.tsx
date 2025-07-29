"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

// Header Component – now more responsive
function Header() {
  return (
    <header style={headerStyles.container}>
      <Link href="/" style={headerStyles.logo}>
        Rani&nbsp;Riwaaj
      </Link>
      <nav style={headerStyles.navLinks}>
        <Link href="/" style={headerStyles.link}>Home</Link>
      </nav>
    </header>
  );
}

// Footer Component
function Footer() {
  return (
    <footer style={footerStyles.container}>
      <div style={footerStyles.row}>
        <p style={footerStyles.text}>
          &copy; {new Date().getFullYear()} Rani&nbsp;Riwaaj. All rights reserved.
        </p>
        <div style={footerStyles.links}>
          <Link href="/privacy" style={footerStyles.link}>Privacy&nbsp;Policy</Link>
          <span style={footerStyles.divider}>|</span>
          <Link href="/terms" style={footerStyles.link}>Terms&nbsp;&amp;&nbsp;Conditions</Link>
        </div>
      </div>
    </footer>
  );
}

// Generic Error Modal Component
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <p style={modalStyles.modalMessage}>{message}</p>
        <button onClick={onClose} style={modalStyles.modalButton}>Close</button>
      </div>
    </div>
  );
}

// Offline Modal Component
function OfflineModal({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.modalTitle}>You&apos;re Offline</h2>
        <p style={modalStyles.modalMessage}>Please check your internet connection and try again.</p>
        <button onClick={onRetry} style={modalStyles.modalButton}>Retry</button>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  // Login form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offline and modal state
  const [isOffline, setIsOffline] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Listen for online/offline events.
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);
  setModalError(null);
  setLoading(true);

  if (!navigator.onLine) {
    setModalError("You are offline. Please check your connection and try again.");
    setLoading(false);
    return;
  }

  try {
    // If you are returning a token in JSON, credentials: "include" is not strictly needed
    // but won't break anything if the server sets it up for CORS.
    const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // credentials: "include", // Only needed if you rely on cookies
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    // 1) Parse the JSON
    const data = await res.json();
    // 2) Check that data.token exists
    if (!data.token) {
      throw new Error("No token in response");
    }

    // 3) Store the token in localStorage
    localStorage.setItem("admin_jwt", data.token);

    // 4) (Optional) console.log to verify
    console.log("Token stored:", data.token);

    // 5) Redirect or navigate as needed
    router.push("/admin");
  } catch (err: unknown) {
    let message = "Something went wrong.";
    if (err instanceof Error) {
      message = err.message;
    }
    setModalError(message);
  } finally {
    setLoading(false);
  }
}
  return (
    <>
      <Header />
      <main style={styles.container}>
        <div style={styles.loginCard}>
          <h1 style={styles.title}>Rani Riwaaj Admin</h1>
          {error && <p style={styles.errorText}>{error}</p>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={styles.iconButton}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
      {modalError && <ErrorModal message={modalError} onClose={() => setModalError(null)} />}
      {isOffline && <OfflineModal onRetry={() => window.location.reload()} />}
    </>
  );
}

// Inline styles using a style object.
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",               // full viewport height
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 1rem 6rem",        // top ≈ header, bottom ≈ footer
    backgroundColor: "#f9fafb",
    boxSizing: "border-box",
  },
  loginCard: {
    background: "rgba(255, 255, 255, 0.85)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    width: "min(90%, 460px)",
    padding: "2.25rem 2rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    margin: "0 1rem",
  },
  title: {
    marginBottom: "1.5rem",
    fontSize: "1.8rem",
    textAlign: "center",
    fontWeight: 700,
  },
  errorText: {
    color: "#d90429",
    marginBottom: "1rem",
    fontWeight: 500,
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  label: {
    fontWeight: 600,
  },
  input: {
    padding: "0.6rem",
    paddingRight: "2.5rem", // provide space for the icon
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  iconButton: {
    position: "absolute",
    right: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    padding: "0.9rem 1.75rem",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    background: "linear-gradient(90deg, #cc444b, #da5552 50%, #e39695)",
    color: "#fff",
    transition: "transform 0.15s ease, opacity 0.25s ease",
  },
  buttonHover: {
    transform: "translateY(-2px)",
  },
};

const headerStyles: Record<string, React.CSSProperties> = {
  container: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderBottom: "2px solid",
    borderImage: "linear-gradient(90deg,#cc444b,#da5552 50%,#e39695) 1",
    color: "#222",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 clamp(1rem, 4vw, 2rem)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 2000,
  },
  navLinks: {
    display: "flex",
    gap: "clamp(0.75rem, 3vw, 2rem)",
  },
  logo: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: 800,
    textDecoration: "none",
    background: "linear-gradient(90deg,#cc444b,#da5552 50%,#e39695)",
    WebkitBackgroundClip: "text",
    color: "transparent",
    whiteSpace: "nowrap",
    transition: "opacity 0.25s",
  },
  link: {
    color: "#333",
    fontSize: "1rem",
    textDecoration: "none",
    transition: "color 0.3s",
  },
};

const footerStyles: Record<string, React.CSSProperties> = {
  container: {
    background: "#1a1a1d",
    borderTop: "3px solid",
    borderImage: "linear-gradient(90deg,#cc444b,#da5552 50%,#e39695) 1",
    color: "#fff",
    padding: "1rem clamp(1rem, 4vw, 2rem)",
  },
  row: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  text: {
    margin: 0,
    fontSize: "0.95rem",
    textAlign: "center",
  },
  links: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  link: {
    color: "#e39695",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "color 0.3s",
    fontWeight: 500,
  },
  divider: {
    color: "#555",
    fontSize: "0.9rem",
  },
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
  },
  modalMessage: {
    color: "#d90429",
    textAlign: "center",
    marginBottom: "1rem",
    fontSize: "1rem",
    lineHeight: "1.4",
  },
  modalButton: {
    padding: "0.5rem 1rem",
    backgroundColor: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    margin: "0 auto",
    display: "block",
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: "1rem",
  },
};
