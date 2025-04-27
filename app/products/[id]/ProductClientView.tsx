"use client";

import { useEffect, useState } from "react";
import Image                     from "next/image";
import { useRouter }             from "next/navigation";
import { toast }                 from "react-toastify";
import { FontAwesomeIcon }       from "@fortawesome/react-fontawesome";
import { faShoppingCart }        from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp }            from "@fortawesome/free-brands-svg-icons";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth }                      from "../../firebaseClient";

import type { GalleryImage }      from "./page";
import styles                      from "./page.module.css";

interface Props {
  product: {
    _id: string;
    name: string;
    price: string;
    desc: string;
    colors?: string[];
    sizes?: string[];
  };
  gallery: GalleryImage[];
}

export default function ProductClientView({ product, gallery }: Props) {
  const [index,      setIndex]      = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [user,       setUser]       = useState<User|null>(null);
  const [busy,       setBusy]       = useState(false);

  const router   = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://rani-riwaaj-backend-ylbq.vercel.app";

  // Watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  // reset skeleton whenever hero image changes
  useEffect(() => {
    setHeroLoaded(false);
  }, [index]);

  const handleSelect = (i: number) => {
    if (i !== index) setIndex(i);
  };

  async function handleAddToCart() {
    if (!user) {
      router.push("/signin");
      return;
    }
    const uid = user.uid;

    setBusy(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/cart?userId=${encodeURIComponent(uid)}`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            items: [
              {
                productId: product._id,
                name:      product.name,
                price:     Number(product.price.replace(/[^\d]/g, "")),
                quantity:  1,
              },
            ],
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update cart");
      }

      toast.success("Added to cart!", { autoClose: 2200 });
    } catch (err: any) {
      console.error("Cart update error:", err);
      toast.error(err.message || "Could not add item – please try again.", { autoClose: 2500 });
    } finally {
      setBusy(false);
    }
  }

  function handleWhatsApp() {
    const msg = encodeURIComponent(
      `I'm interested in ${product.name} priced at Rs ${product.price}. Please send me more details.`
    );
    window.open(
      `https://api.whatsapp.com/send?phone=+919510394742&text=${msg}`,
      "_blank"
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.grid}>
        {/* GALLERY */}
        <div className={styles.galleryOuter}>
          <div className={styles.thumbs}>
            {gallery.map((img, i) => (
              <button
                key={img.url + i}
                className={`${styles.thumb} ${i === index ? styles.thumbActive : ""}`}
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

        {/* DETAILS */}
        <section className={styles.details}>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.price}>Rs {product.price}</p>
          <p className={styles.desc}>{product.desc}</p>

          {/* only render if colors array actually exists and has items */}
          {product.colors && product.colors.length > 0 && (
            <div className={styles.colorRow}>
              {product.colors.map((c) => (
                <span
                  key={c}
                  className={styles.colorSwatch}
                  style={{ background: c }}
                />
              ))}
            </div>
          )}

          {/* only render if sizes array actually exists and has items */}
          {product.sizes && product.sizes.length > 0 && (
            <div className={styles.sizeRow}>
              {product.sizes.map((s) => (
                <span key={s} className={styles.sizeChip}>{s}</span>
              ))}
            </div>
          )}

          <div className={styles.actionBtns}>
            <button
              className={styles.primaryBtn}
              disabled={busy}
              onClick={handleAddToCart}
            >
              {busy
                ? "Adding…"
                : (
                  <>
                    <FontAwesomeIcon icon={faShoppingCart} />
                    &nbsp;Add to Cart
                  </>
                )}
            </button>

            <button className={styles.secondaryBtn} onClick={handleWhatsApp}>
              <FontAwesomeIcon icon={faWhatsapp} />
              &nbsp;WhatsApp Enquiry
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
