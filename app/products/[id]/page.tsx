import { Metadata } from "next";
import Link from "next/link";
import ProductClientView from "./ProductClientView";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export const revalidate = 0;
const API_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";

type ProductImage = {
  url: string;
};

interface ProductResponse {
  _id: string;
  name: string;
  desc: string;
  price: string;
  defaultImage?: ProductImage;
  globalImages?: ProductImage[];
  imagesByColor?: Record<string, ProductImage[]>;
  colors?: string[];
  sizes?: string[];
}

export interface GalleryImage {
  url: string;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const res = await fetch(`${API_BASE}/api/products/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) return {};
  const product: ProductResponse = await res.json();
  return {
    title: `${product.name} | Rani Riwaaj`,
    description: product.desc,
    openGraph: {
      images: [product.defaultImage?.url ?? "/images/phulkari_bag.webp"],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await fetch(`${API_BASE}/api/products/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return (
      <>
        <SiteHeader />
        <main style={{ padding: "2rem", textAlign: "center" }}>
          Product not found. <Link href="/">Back to shop</Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const raw: ProductResponse = await res.json();

  // parse and normalize
  const priceNum = parseFloat(raw.price.replace(/,/g, "")) || 0;
  const mrpNum = Math.round(priceNum * 1.2);
  const savePct = priceNum ? Math.round((1 - priceNum / mrpNum) * 100) : 0;

  // build gallery
  const gallery = [
    ...(raw.globalImages ?? []),
    ...Object.values(raw.imagesByColor ?? {}).flat(),
  ].map((img): GalleryImage => ({ url: img.url }));
  if (gallery.length === 0) {
    gallery.push({ url: raw.defaultImage?.url ?? "/images/phulkari_bag.webp" });
  }

  const enriched = {
    _id: raw._id,
    name: raw.name,
    desc: raw.desc,
    price: priceNum.toLocaleString("en-IN"),
    mrp: mrpNum.toLocaleString("en-IN"),
    savePct,
    rating: 4.5, // placeholder
    reviewsCount: 86, // placeholder
    giftWrapFee: 200, // ₹200
    sku: raw._id.slice(-6).toUpperCase(),
    defaultImage: raw.defaultImage,
    colors:
      Array.isArray(raw.colors) && raw.colors.length
        ? raw.colors
        : ["#E91E63", "#03A9F4", "#4CAF50"],
    sizes:
      Array.isArray(raw.sizes) && raw.sizes.length
        ? raw.sizes
        : ["XS", "S", "M", "L", "XL"],
  };

  return (
    <>
      <SiteHeader />

      <ProductClientView
        product={{
          ...enriched,
          mrp: mrpNum.toLocaleString("en-IN"),
          savePct,
          rating: 4.5,
          reviewsCount: 86,
          giftWrapFee: 200,
          sku: raw._id.slice(-6).toUpperCase(),
        }}
        gallery={gallery}
        whatsappNumber="+919041798129"
      />

      <SiteFooter />
    </>
  );
}
