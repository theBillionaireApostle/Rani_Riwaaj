"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faChevronDown,
  faBars,
  faXmark,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import { auth } from "@/app/firebaseClient";          // ← adjust if auth is elsewhere
import styles from "./SiteHeader.module.css";
import { useWishlist } from "@/lib/useWishlist";

type Props = {
  /** allow the page to pass cartCount if you fetch it there */
  initialCartCount?: number;
};

export default function Header({ initialCartCount = 0 }: Props) {
  /* ───────── AUTH & CART STATE ───────── */
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const { count: wishlistCount } = useWishlist({
    userId: user?.uid,
    enabled: !!user,
  });

  /* ───────── MOBILE MENU ───────── */
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Optional: re-fetch cart when user changes
  useEffect(() => {
    async function fetchCart() {
      if (!user) return;
      try {
        const res = await fetch(
          `https://rani-riwaaj-backend-ylbq.vercel.app/api/cart?userId=${user.uid}`
        );
        if (res.ok) {
          const data = await res.json();
          const total = (data.items ?? []).reduce(
            (acc: number, it: any) => acc + it.quantity,
            0
          );
          setCartCount(total);
        }
      } catch (e) {
        // ignore network errors silently for header
      }
    }
    fetchCart();
  }, [user]);

  // Close mobile menu with ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Helper to close after navigation in mobile
  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => {
    if (!auth) return;
    signOut(auth);
  };

  return (
    <nav className={styles.nav} role="navigation" aria-label="Primary">
      <div className={styles.navInner}>
        {/* LEFT — Brand */}
        <Link href="/" className={styles.logo} aria-label="RaniRiwaaj Home">
          Rani&nbsp;<span className={styles.brandMark}>Riwaaj</span>
        </Link>

        {/* HAMBURGER (mobile only via CSS) */}
        <button
          type="button"
          className={styles.hamburger}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobileMenu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
        </button>

        {/* RIGHT — Desktop inline items */}
        <div className={styles.rightSection}>
          <div className={styles.desktopLinks}>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <Link href="/wishlist" className={styles.wishlistLink} aria-label="Wishlist">
            <FontAwesomeIcon icon={faHeart} />
            {wishlistCount > 0 && (
              <span className={styles.badge} aria-label={`${wishlistCount} items in wishlist`}>
                {wishlistCount}
              </span>
            )}
          </Link>

          {authLoading ? (
            <div className={styles.loader} />
          ) : user ? (
            <>
              {/* CART */}
              <Link href="/cart" className={styles.cartLink} aria-label="Cart">
                <FontAwesomeIcon icon={faShoppingCart} />
                {cartCount > 0 && (
                  <span className={styles.badge} aria-label={`${cartCount} items in cart`}>
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* USER DROPDOWN */}
              <UserDropdown user={user} onLogout={handleLogout} />
            </>
          ) : (
            <Link href="/signin" className={styles.authLink}>
              Sign In&nbsp;/&nbsp;Sign Up
            </Link>
          )}

          {/* WHATSAPP CTA */}
          <a
            href="https://api.whatsapp.com/send?phone=+919510394742&text=Hi%20I%20have%20an%20enquiry"
            className={styles.enquireBtn}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faWhatsapp} />
            <span>Enquire&nbsp;Now</span>
          </a>
        </div>
      </div>

      {/* SCRIM (click to close) */}
      {mobileOpen && (
        <div className={styles.scrim} onClick={closeMobile} aria-hidden="true" />
      )}

      {/* MOBILE MENU PANEL */}
      <div
        id="mobileMenu"
        className={`${styles.mobileMenu} ${mobileOpen ? styles.open : ""}`}
      >
        <div className={styles.mobileMenuHeader}>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close menu"
            onClick={closeMobile}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
          {user ? (
            <div className={styles.userRow}>
              <span className={styles.userAvatarSm} aria-hidden>
                {getInitials(user)}
              </span>
              <div className={styles.userMeta}>
                <strong>{user.displayName || "Account"}</strong>
                <small>{user.email}</small>
              </div>
            </div>
          ) : (
            <div className={styles.userRowAnon}>Welcome to RaniRiwaaj</div>
          )}
        </div>

        <div className={styles.mobileLinks}>
          <Link href="/about" onClick={closeMobile}>About</Link>
          <Link href="/contact" onClick={closeMobile}>Contact</Link>
          <Link href="/shop" onClick={closeMobile}>Shop</Link>
          <Link href="/faqs" onClick={closeMobile}>FAQs</Link>
        </div>

        <div className={styles.menuDivider} />

        <div className={styles.mobileActions}>
          <Link href="/wishlist" className={styles.cartRow} onClick={closeMobile}>
            <FontAwesomeIcon icon={faHeart} />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <em className={styles.badge}>{wishlistCount}</em>
            )}
          </Link>

          <Link href="/cart" className={styles.cartRow} onClick={closeMobile}>
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Cart</span>
            {cartCount > 0 && <em className={styles.badge}>{cartCount}</em>}
          </Link>

          {user ? (
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => { handleLogout(); closeMobile(); }}
            >
              Logout
            </button>
          ) : (
            <Link href="/signin" className={styles.authCTA} onClick={closeMobile}>
              Sign In / Sign Up
            </Link>
          )}

          <a
            href="https://api.whatsapp.com/send?phone=+919510394742&text=Hi%20I%20have%20an%20enquiry"
            className={styles.menuCTA}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMobile}
          >
            <FontAwesomeIcon icon={faWhatsapp} />
            <span>Enquire on WhatsApp</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ──────────────── Helpers ──────────────── */
function getInitials(user: User){
  if (user.displayName) {
    return user.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }
  return user.email?.[0].toUpperCase() ?? "";
}

/* ──────────────── UserDropdown (desktop) ──────────────── */
function UserDropdown({ user, onLogout }: { user: User; onLogout: () => void; }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className={styles.userDropdown} ref={wrapRef}>
      <button
        type="button"
        className={styles.userAvatar}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((p) => !p)}
      >
        {initials}
        <FontAwesomeIcon icon={faChevronDown} className={styles.chev} />
      </button>

      {open && (
        <div
          role="menu"
          className={`${styles.dropdownMenu} ${styles.dropdownMenuOpen}`}
        >
          <button className={styles.dropdownItem} onClick={onLogout} role="menuitem">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
