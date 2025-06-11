"use client";

import { useState, useEffect } from "react";
import Image             from "next/image";
import Link              from "next/link";
import { useRouter }     from "next/navigation";
import { toast }         from "react-toastify";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth }                      from "../app/firebaseClient"; // adjust as needed

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faHeart } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp }               from "@fortawesome/free-brands-svg-icons";

import styles from "./productsGrid.module.css";

export interface Product {
  _id: string;
  name: string;
  desc: string;
  price: number;
  defaultImage?: { url: string };
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

  function handleWhatsAppEnquiry(p: Product) {
    const msg = encodeURIComponent(
      `I'm interested in ${p.name} priced at Rs ${p.price.toLocaleString()}. Please send me more details.`
    );
    window.open(`https://api.whatsapp.com/send?phone=+919041798129&text=${msg}`, "_blank");
  }

  if (!products.length) {
    return <p className={styles.empty}>No products found.</p>;
  }

  return (
    <div className={styles.grid}>
      {products.map((p) => (
        <div key={p._id} className={styles.card}>
          {/* wishlist */}
          <button className={styles.wishlistBtn} aria-label="Add to wishlist">
            <FontAwesomeIcon icon={faHeart} />
          </button>

          {/* full-card link */}
          <Link href={`/products/${p._id}`} className={styles.linkOverlay} />

          {/* image */}
          <div className={styles.imageWrapper}>
            <Image
              src={p.defaultImage?.url ?? "/placeholder.png"}
              alt={p.name}
              fill
              className={styles.image}
            />
          </div>

          {/* info */}
          <h3 className={styles.name}>{p.name}</h3>
          <p className={styles.desc}>{p.desc}</p>
          <p className={styles.price}>Rs {p.price.toLocaleString()}</p>

          {/* actions */}
          <div className={styles.cardButtons}>
            <button
              className={styles.addButton}
              onClick={() => handleAddToCart(p)}
              disabled={loadingId === p._id}
            >
              {loadingId === p._id ? (
                "Adding…"
              ) : (
                <>
                  <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                </>
              )}
            </button>

            <button
              className={styles.whatsappButton}
              onClick={() => handleWhatsAppEnquiry(p)}
            >
              <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp Enquiry
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
