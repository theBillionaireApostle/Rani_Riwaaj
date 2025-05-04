// app/category/[slug]/page.tsx
import type { Metadata } from "next";
import { ProductsGrid } from "../../../components/ProductsGrid";   // adjust path!
import SiteHeader         from "@/components/layout/SiteHeader";
import SiteFooter         from "@/components/layout/SiteFooter";
import styles             from "./page.module.css";

const API_BASE ="https://rani-riwaaj-backend-ylbq.vercel.app";

/* ------------ <head> metadata ------------ */
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const title = `${params.slug} | Rani Riwaaj`;
  return {
    title,
    description: `Browse ${params.slug} in our store`
  };
}

/* -------------   PAGE   ------------------- */
export default async function CategoryPage(
  { params }: { params: { slug: string } }
) {
  const res = await fetch(`${API_BASE}/api/products?category=${params.slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return (
      <>
        <SiteHeader />
        <main className={styles.center}>
          <p>Category not found.</p>
          <p><a href="/">Back&nbsp;to&nbsp;shop</a></p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const products = await res.json();

  return (
    <>
      <SiteHeader />

      <main className={styles.page}>
        <h1 className={styles.title}>{params.slug.replace(/-/g, " ")}</h1>
        <ProductsGrid products={products} />
      </main>

      <SiteFooter />
    </>
  );
}
