import Link from "next/link";
import { ProductsCatalogClient } from "./ProductsCatalogClient";

interface ProductListItem {
  _id: string;
  badge?: string;
  defaultImage?: { url?: string };
  desc?: string;
  name: string;
  price: string | number;
  published?: boolean;
}

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://rani-riwaaj-backend-ylbq.vercel.app/";

async function getProducts(): Promise<ProductListItem[]> {
  const response = await fetch(new URL("/api/products", BACKEND_BASE).toString(), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products.");
  }

  return response.json();
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  const published = products.filter((product) => product.published).length;
  const averagePrice = products.length
    ? Math.round(
        products.reduce((sum, product) => {
          const value =
            typeof product.price === "number"
              ? product.price
              : Number.parseFloat(String(product.price).replace(/[^\d.]/g, "")) || 0;

          return sum + value;
        }, 0) / products.length
      )
    : 0;
  const withImages = products.filter((product) => product.defaultImage?.url).length;

  return (
    <section className="rr-admin-page">
      <div className="rr-admin-pageIntro">
        <div className="rr-admin-pageLead">
          <span className="rr-admin-kicker">Catalog</span>
          <h1 className="rr-admin-pageTitle">Products</h1>
          <p className="rr-admin-pageDescription">
            Scan the catalog and jump straight into edits.
          </p>
        </div>
        <div className="rr-admin-actions">
          <Link
            href="/admin/products/create"
            className="rr-admin-button rr-admin-button--primary"
          >
            Create product
          </Link>
        </div>
      </div>

      <div className="rr-admin-statGrid">
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Products</span>
          <strong className="rr-admin-statValue">{products.length}</strong>
          <span className="rr-admin-statMeta">Current catalog items.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Published</span>
          <strong className="rr-admin-statValue">{published}</strong>
          <span className="rr-admin-statMeta">Ready on the storefront.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">With imagery</span>
          <strong className="rr-admin-statValue">{withImages}</strong>
          <span className="rr-admin-statMeta">Products with a hero image already set.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Average price</span>
          <strong className="rr-admin-statValue">₹{averagePrice.toLocaleString("en-IN")}</strong>
          <span className="rr-admin-statMeta">Useful for quick catalog sanity checks.</span>
        </article>
      </div>

      <ProductsCatalogClient products={products} />
    </section>
  );
}
