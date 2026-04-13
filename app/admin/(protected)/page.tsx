// app/admin/(protected)/page.tsx
import Dashboard from "./Dashboard.client"; // Import the client component

export const metadata = {
  title: "Admin Dashboard | Rani Riwaaj",
  description: "Manage products for Rani Riwaaj",
};

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://rani-riwaaj-backend-ylbq.vercel.app/";

async function fetchJson(path: string) {
  const url = new URL(path, BACKEND_BASE).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return res.json();
}

export default async function AdminDashboardPage() {
  const [productsResult, categoriesResult, tagsResult] = await Promise.allSettled([
    fetchJson("/api/products"),
    fetchJson("/api/categories"),
    fetchJson("/api/tags"),
  ]);

  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];

  const issues = [
    productsResult.status === "rejected" ? "Products are temporarily unavailable." : null,
    categoriesResult.status === "rejected"
      ? "Categories could not be loaded for this snapshot."
      : null,
    tagsResult.status === "rejected" ? "Tags could not be loaded for this snapshot." : null,
  ].filter(Boolean) as string[];

  return (
    <Dashboard
      products={products}
      categoryCount={categories.length}
      tagCount={tags.length}
      issues={issues}
    />
  );
}
