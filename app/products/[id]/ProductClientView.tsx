// app/products/[id]/ProductClientView.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  faStar as faStarSolid,
  faShoppingCart,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebaseClient";

import type { GalleryImage } from "./page";
import styles from "./page.module.css";

interface Props {
  product: {
    _id: string;
    name: string;
    desc: string;
    price: string;           // e.g. "1,499"
    mrp: string;             // e.g. "1,799"
    savePct: number;         // e.g. 18
    rating: number;          // 0–5
    reviewsCount: number;    // e.g. 86
    giftWrapFee: number;     // e.g. 200
    sku: string;             // e.g. "A1B2C3"
    colors?: string[];
    sizes?: string[];
  };
  gallery: GalleryImage[];
  whatsappNumber: string;    // e.g. "+919041798129"
}

export default function ProductClientView({
  product,
  gallery,
  whatsappNumber,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // reset skeleton on main image change
  useEffect(() => setHeroLoaded(false), [index]);

  // ── Gallery selector ──
  const handleSelect = (i: number) => {
    if (i !== index) setIndex(i);
  };

  // ── Add to Cart ──
  async function handleAddToCart() {
  if (!user) {
    router.push("/signin");
    return;
  }
  setBusy(true);

  try {
    // pick the correct backend in dev & prod
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

    const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,          // ✅ move here, NOT in the query-string
        items: [
          {
            productId: product._id,
            name: product.name,
            price: Number(product.price.replace(/[^\d]/g, "")),
            quantity: 1,
            ...(giftWrap && { giftWrap: true }),
          },
        ],
      }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Failed to add to cart");
    }

    toast.success("Added to cart!", { autoClose: 2000 });
  } catch (err: any) {
    toast.error(err.message || "Could not add – please try again.", {
      autoClose: 2500,
    });
  } finally {
    setBusy(false);
  }
}
  // ── WhatsApp Enquiry ──
  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `I'm interested in *${product.name}* (SKU: ${product.sku}) priced at ₹${product.price}.`
    );
    window.open(
      `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${msg}`,
      "_blank"
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.grid}>
        {/* ── GALLERY (unchanged) ── */}
        <div className={styles.galleryOuter}>
          <div className={styles.thumbs}>
            {gallery.map((img, i) => (
              <button
                key={img.url + i}
                className={`${styles.thumb} ${
                  i === index ? styles.thumbActive : ""
                }`}
                onClick={() => handleSelect(i)}
                aria-label={`View image ${i + 1}`}
                type="button"
              >
                <Image src={img.url} alt="" fill sizes="72px" />
              </button>
            ))}
          </div>
          <div className={styles.hero}>
            {!heroLoaded && <span className={styles.imgSkeleton} />}
            <Image
              src={gallery[index].url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 680px"
              priority
              style={{ objectFit: "contain" }}
              onLoadingComplete={() => setHeroLoaded(true)}
            />
          </div>
        </div>

        {/* ── DETAILS (polished) ── */}
        <section className={styles.details}>
          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.ratingRow}>
            <FontAwesomeIcon icon={faStarSolid} className={styles.starIcon} />
            <span className={styles.ratingValue}>
              {product.rating.toFixed(1)}
            </span>
            <span className={styles.reviewsCount}>
              ({product.reviewsCount} reviews)
            </span>
          </div>

          <div className={styles.priceRow}>
            <span className={styles.currentPrice}>₹{product.price}</span>
            <span className={styles.originalPrice}>₹{product.mrp}</span>
            <span className={styles.discountText}>
              Save {product.savePct}%
            </span>
          </div>

          <p className={styles.desc}>{product.desc}</p>

          {product.colors?.length > 0 && (
            <div className={styles.optionGroup}>
              <h3 className={styles.optionTitle}>Colors</h3>
              <div className={styles.colorRow}>
                {product.colors.map((c) => (
                  <span
                    key={c}
                    className={styles.colorSwatch}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className={styles.optionGroup}>
              <h3 className={styles.optionTitle}>Sizes</h3>
              <div className={styles.sizeRow}>
                {product.sizes.map((s) => (
                  <span key={s} className={styles.sizeChip}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.optionGroup}>
            <label className={styles.giftWrapLabel}>
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={() => setGiftWrap((p) => !p)}
                className={styles.giftWrapCheckbox}
              />
              Gift wrap this product? ₹
              {product.giftWrapFee.toLocaleString("en-IN")}
            </label>
          </div>

          <div className={styles.skuRow}>SKU: {product.sku}</div>

          <div className={styles.actionBtns}>
            <button
              className={styles.primaryBtn}
              disabled={busy}
              onClick={handleAddToCart}
            >
              <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
            </button>

            <button
              className={styles.secondaryBtn}
              onClick={handleWhatsApp}
            >
              <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp Enquiry
            </button>
          </div>

          <div className={styles.infoRow}>
            <span>🚚 Free delivery on all prepaid orders in India</span>
            <span>🔄 Easy returns &amp; exchanges</span>
          </div>
        </section>
      </div>
    </main>
  );
}
