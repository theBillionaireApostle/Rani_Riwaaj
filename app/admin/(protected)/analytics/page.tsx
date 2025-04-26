// app/admin/(protected)/analytics/page.tsx
import { Metadata } from "next"
import styles from "./analytics.module.css"

export const metadata: Metadata = {
  title: "Analytics | Phulkari Bagh Admin",
  description: "Overview of your Phulkari Bagh store",
}

async function getStats() {
  const base = process.env.BACKEND_URL || "https://rani-riwaaj-backend-ylbq.vercel.app/"
  const [prodRes, catRes] = await Promise.all([
    fetch(`${base}/api/products`,   { cache: "no-store" }),
    fetch(`${base}/api/categories`, { cache: "no-store" }),
  ])
  if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch analytics")
  const [products, categories] = await Promise.all([prodRes.json(), catRes.json()])
  return {
    productCount: Array.isArray(products)   ? products.length   : 0,
    categoryCount: Array.isArray(categories) ? categories.length : 0,
  }
}

export default async function AnalyticsPage() {
  const { productCount, categoryCount } = await getStats()

  return (
    <section>
      <h1 className={styles.pageTitle}>Analytics</h1>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Products</h3>
          <p>{productCount}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Categories</h3>
          <p>{categoryCount}</p>
        </div>
      </div>
    </section>
  )
}
