"use client";

import { useState, useEffect } from "react";
import Image             from "next/image";
import Link              from "next/link";
import { useRouter }     from "next/navigation";
import { toast }         from "react-toastify";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth }                      from "../app/firebaseClient"; // adjust as needed

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartPlus, faHeart, faStar } from "@fortawesome/free-solid-svg-icons";

import styles from "./productsGrid.module.css";

export interface Product {
  _id: string;
  name: string;
  desc: string;
  price: number;
  defaultImage?: { url: string };
  originalPrice?: number;
  discountText?: string;      // e.g. "-17%"
  colors?: string[];          // array of hex color codes
  badgeLabel?: string;        // e.g. "BESTSELLER"
  rating?: number;            // e.g. 4.6
}

interface Props {
  products: Product[];
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export function ProductsGrid({ products }: Props) {
  const router = useRouter();
  const [user, setUser]           = useState<User | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const API_BASE                  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5005";

  // Watch auth state (and we don't need to fetch existing cart here, since
  // we're always overwriting with our single-item POST)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  async function handleAddToCart(p: Product) {
    if (!user) {
      router.push("/signin");
      return;
    }

    setLoadingId(p._id);

    try {
      // ⚠️ exactly the same working pattern from ProductClientView
      const res = await fetch(
        `${API_BASE}/api/cart?userId=${encodeURIComponent(user.uid)}`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            items: [
              {
                productId: p._id,
                name:      p.name,
                price:     p.price,
                quantity:  1,
              },
            ],
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        // will catch your route’s 400 errors
        throw new Error(data.error || data.message || "Failed to update cart");
      }

      toast.success("Added to cart!", { autoClose: 2000 });
    } catch (err: any) {
      console.error("Cart update error:", err);
      toast.error(err.message || "Could not update cart", { autoClose: 2500 });
    } finally {
      setLoadingId(null);
    }
  }

  if (!products.length) {
    return <p className={styles.empty}>No products found.</p>;
  }

  return (
    <ul className={styles.productsWrapper}>
      {products.map((p) => {
        // Compute discount percentage
        const discountPerc =
          p.originalPrice && p.originalPrice > p.price
            ? Math.round((1 - p.price / p.originalPrice) * 100)
            : 0;
        // Final discount text or null
        const finalDiscountText = p.discountText ?? (discountPerc > 0 ? `-${discountPerc}%` : null);
        // Enrich badge: use backend label or HOT DEAL if discount ≥25%
        const badgeText = p.badgeLabel ?? (discountPerc >= 25 ? "HOT DEAL" : undefined);
        // Enrich rating: use backend value or random 4.0–5.0
        const displayRating =
          typeof p.rating === "number"
            ? p.rating
            : parseFloat((Math.random() * 1 + 4).toFixed(1));
        // Ensure at least three swatches: backend or fallback palette
        const swatches = p.colors && p.colors.length
          ? p.colors.slice(0, 3)
          : ["#e81e61", "#06a8f5", "#4daf50"];

        return (
          <li key={p._id} className={styles.cardShell}>
            {/* full‑card link overlay */}
            <Link href={`/products/${p._id}`} className={styles.fullLink} />

            {/* wishlist heart */}
            <button className={styles.wishlistBtn} aria-label="Add to wishlist">
              <FontAwesomeIcon icon={faHeart} />
            </button>

            {/* badge (e.g. BESTSELLER or HOT DEAL) */}
            {badgeText && (
              <div className={styles.badge}>{badgeText}</div>
            )}

            {/* rating badge */}
            <div className={styles.ratingBadge}>
              <FontAwesomeIcon icon={faStar} />
              <span>{displayRating.toFixed(1)}</span>
            </div>

            {/* hero image */}
            <figure className={styles.cardHero}>
              <Image
                src={p.defaultImage?.url ?? "/placeholder.png"}
                alt={p.name}
                fill
                sizes="(max-width: 768px) 100vw, 260px"
                className={styles.cardHeroImg}
              />
            </figure>

            {/* body */}
            <div className={styles.body}>
              <h3 className={styles.title}>{p.name}</h3>

              <div className={styles.priceRow}>
                <span className={styles.current}>
                  ₹{p.price.toLocaleString()}
                </span>
                {p.originalPrice && p.originalPrice > p.price && finalDiscountText && (
                  <>
                    <span className={styles.original}>
                      ₹{p.originalPrice.toLocaleString()}
                    </span>
                    <span className={styles.discountText}>
                      {finalDiscountText}
                    </span>
                  </>
                )}
              </div>

              {/* color swatches */}
              <div className={styles.swatchRow}>
                {swatches.map((c, i) => (
                  <span
                    key={i}
                    className={styles.swatch}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* add‑to‑cart button */}
            <button
              className={styles.addButton}
              onClick={() => handleAddToCart(p)}
              disabled={loadingId === p._id}
              aria-label="Add to cart"
            >
              <FontAwesomeIcon icon={faCartPlus} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
