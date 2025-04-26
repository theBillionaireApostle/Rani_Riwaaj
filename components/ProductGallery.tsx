"use client";

import Image from "next/image";
import { useState, useId, useCallback, Fragment } from "react";
import styles from "./ProductGallery.module.css";

/** Accept any array of {url, publicId} coming from Cloudinary */
export interface GalleryImage {
  url: string;
  publicId: string;
}

export default function ProductGallery({
  images,
  alt,
}: {
  images: GalleryImage[];
  alt: string;
}) {
  /* ----- internal state ----- */
  const [active, setActive] = useState(0);
  const uid = useId(); // for aria-attributes

  /* ----- helpers ----- */
  const next   = useCallback(() => setActive((p) => (p + 1) % images.length), [images.length]);
  const prev   = useCallback(() => setActive((p) => (p - 1 + images.length) % images.length), [
    images.length,
  ]);

  /* ----- keyboard support on main image ----- */
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  /* ----- render ----- */
  return (
    <figure className={styles.gallery}>
      {/* hero */}
      <div
        className={styles.heroWrapper}
        tabIndex={0}
        onKeyDown={handleKey}
        aria-labelledby={`${uid}-caption`}
      >
        {images.map((img, idx) => (
          <Fragment key={img.publicId}>
            {idx === active && (
              <Image
                src={img.url}
                alt={alt}
                fill
                priority
                sizes="(min-width:768px) 600px, 100vw"
                className={styles.heroImg}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* thumbs */}
      <ul className={styles.thumbRail} aria-label="Product images">
        {images.map((img, idx) => (
          <li key={img.publicId}>
            <button
              className={`${styles.thumbBtn} ${active === idx ? styles.active : ""}`}
              onClick={() => setActive(idx)}
              aria-current={active === idx}
            >
              <Image
                src={img.url}
                alt=""
                width={72}
                height={72}
                className={styles.thumbImg}
              />
            </button>
          </li>
        ))}
      </ul>

      <figcaption id={`${uid}-caption`} className="sr-only">
        {alt}
      </figcaption>
    </figure>
  );
}