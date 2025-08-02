"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShoppingCart,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import { auth } from "@/app/firebaseClient";          // ← adjust if auth is elsewhere
import styles from "./SiteHeader.module.css";

type Props = {
  /* allow the page to pass cartCount if you fetch it there */
  initialCartCount?: number;
};

export default function Header({ initialCartCount = 0 }: Props) {
  const router = useRouter();

  /* ───────── AUTH & CART STATE ───────── */
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartCount, setCartCount] = useState(initialCartCount);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  /* Optional: re-fetch cart when user changes */
  useEffect(() => {
    async function fetchCart() {
      if (!user) return;
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
    }
    fetchCart();
  }, [user]);

  return (
    <nav className={styles.nav}>
      {/* LEFT — Logo */}
      <Link href="/" className={styles.logo}>
        Rani&nbsp;Riwaaj
      </Link>

      {/* RIGHT */}
      <div className={styles.rightSection}>
        {authLoading ? (
          <div className={styles.loader} />
        ) : user ? (
          <>
            {/* CART */}
            <Link href="/cart" className={styles.cartLink}>
              <FontAwesomeIcon icon={faShoppingCart} />
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount}</span>
              )}
            </Link>

            {/* USER DROPDOWN */}
            <UserDropdown user={user} onLogout={() => signOut(auth)} />
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
          rel="noopener"
        >
          <FontAwesomeIcon icon={faWhatsapp} />
          <span>Enquire&nbsp;Now</span>
        </a>
      </div>
    </nav>
  );
}

/* ──────────────── UserDropdown ──────────────── */
function UserDropdown({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.[0].toUpperCase() ?? "";

  return (
    <div className={styles.userDropdown}>
      <button
        type="button"
        className={styles.userAvatar}
        onClick={() => setOpen((p) => !p)}
      >
        {initials}
        <FontAwesomeIcon icon={faChevronDown} className={styles.chev} />
      </button>

      {open && (
        <div className={styles.dropdownMenu}>
          <button className={styles.dropdownItem} onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
