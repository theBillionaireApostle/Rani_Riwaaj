"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import { onAuthStateChanged, User } from "firebase/auth";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { auth } from "@/app/firebaseClient";
import { useWishlist } from "@/lib/useWishlist";
import styles from "./page.module.css";

const formatPrice = (price?: number) => {
  if (price == null) return null;
  return `₹${price.toLocaleString("en-IN")}`;
};

export default function WishlistPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { items, remove, clear } = useWishlist({
    userId: user?.uid,
    enabled: !!user,
  });

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Your Wishlist</h1>
              <span className={styles.countBadge}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <p className={styles.subtitle}>
              Save the pieces you love and come back anytime to make them yours.
            </p>
            <div className={styles.heroActions}>
              <Link href="/#shop" className={styles.primaryBtn}>
                Shop New Arrivals
              </Link>
              {items.length > 0 && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={clear}
                >
                  Clear wishlist
                </button>
              )}
            </div>
          </div>
        </section>

        {authLoading ? (
          <section className={styles.stateCard}>
            <div className={styles.loader} />
            <p>Loading your wishlist...</p>
          </section>
        ) : !user ? (
          <section className={styles.stateCard}>
            <div className={styles.stateIcon}>
              <FontAwesomeIcon icon={faHeart} />
            </div>
            <h2>Sign in to view your wishlist</h2>
            <p>
              Save your favorites across devices and come back to them anytime.
            </p>
            <Link href="/signin" className={styles.primaryBtn}>
              Sign In
            </Link>
          </section>
        ) : items.length === 0 ? (
          <section className={styles.emptyState}>
            <div className={styles.emptyCard}>
              <div className={styles.emptyMedia}>
                <Image
                  src="/images/phulkari_bag.webp"
                  alt="Wishlist placeholder"
                  fill
                  sizes="240px"
                  className={styles.emptyImg}
                />
              </div>
              <h2>No favorites yet</h2>
              <p>
                Tap the heart on any product to save it here for later.
              </p>
              <Link href="/#shop" className={styles.primaryBtn}>
                Explore the collection
              </Link>
            </div>
          </section>
        ) : (
          <section className={styles.gridSection}>
            <div className={styles.grid}>
              {items.map((item) => (
                <article key={item.id} className={styles.card}>
                  <Link
                    href={`/products/${item.id}`}
                    className={styles.cardLink}
                    aria-label={`View ${item.name}`}
                  />
                  <button
                    type="button"
                    className={styles.heartBtn}
                    aria-label="Remove from wishlist"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(item.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                  <div className={styles.media}>
                    <Image
                      src={item.image || "/images/phulkari_bag.webp"}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 90vw, 260px"
                      className={styles.cardImg}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    {formatPrice(item.price) && (
                      <p className={styles.price}>{formatPrice(item.price)}</p>
                    )}
                    <span className={styles.viewHint}>View details</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
