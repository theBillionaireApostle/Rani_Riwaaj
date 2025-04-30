import { Metadata } from "next";
import ProductClientView from "./ProductClientView";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export const revalidate = 0;
const API_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const res = await fetch(`${API_BASE}/api/products/${params.id}`, {
    cache: "no-store",
  });
  if (!res.ok) return {};
  const p: any = await res.json();
  return {
    title: `${p.name} | Rani Riwaaj`,
    description: p.desc,
    openGraph: { images: [p.defaultImage?.url ?? "/placeholder.png"] },
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
          Product not found. <a href="/">Back to shop</a>
        </main>
        <SiteFooter />
      </>
    );
  }

  const raw: any = await res.json();

  // parse and normalize
  const priceNum = parseFloat(raw.price.replace(/,/g, "")) || 0;
  const mrpNum = Math.round(priceNum * 1.2);
  const savePct = priceNum ? Math.round((1 - priceNum / mrpNum) * 100) : 0;

  // build gallery
  const gallery = [
    ...(raw.globalImages ?? []),
    ...Object.values(raw.imagesByColor ?? {}).flat(),
  ].map((img: any) => ({ url: img.url }));
  if (gallery.length === 0) {
    gallery.push({ url: raw.defaultImage?.url ?? "/placeholder.png" });
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
