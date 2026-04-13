import Image from "next/image";
import Link from "next/link";

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

function parsePrice(value: string | number) {
  if (typeof value === "number") return value;
  return Number.parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
}

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
        products.reduce((sum, product) => sum + parsePrice(product.price), 0) / products.length
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

      <div className="rr-admin-panel">
        <div className="rr-admin-panelHeader">
          <div>
            <h2 className="rr-admin-panelTitle">Catalog list</h2>
            <p className="rr-admin-panelText">
              Product list with direct edit access.
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rr-admin-emptyState">
            <strong>No products found</strong>
            <p>Create the first product to start building the collection.</p>
          </div>
        ) : (
          <div className="rr-admin-cardGrid">
            {products.map((product) => (
              <article key={product._id} className="rr-admin-productCard">
                <div className="rr-admin-mediaFrame rr-admin-mediaFrame--compact">
                  <Image
                    src={product.defaultImage?.url || "/images/phulkari_bag.webp"}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="rr-admin-productBody">
                  <div>
                    <h3 className="rr-admin-listTitle">{product.name}</h3>
                    <p className="rr-admin-listSubtitle">
                      {product.desc || "Description pending."}
                    </p>
                  </div>

                  <div className="rr-admin-listMeta">
                    <span
                      className={`rr-admin-badge ${
                        product.published
                          ? "rr-admin-badge--success"
                          : "rr-admin-badge--warning"
                      }`}
                    >
                      {product.published ? "Published" : "Draft"}
                    </span>
                    {product.badge ? (
                      <span className="rr-admin-badge rr-admin-badge--info">{product.badge}</span>
                    ) : null}
                  </div>

                  <div className="rr-admin-productMetaRow">
                    <strong>₹{parsePrice(product.price).toLocaleString("en-IN")}</strong>
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="rr-admin-button rr-admin-button--secondary"
                    >
                      Edit product
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
