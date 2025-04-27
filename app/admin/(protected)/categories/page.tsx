// app/admin/(protected)/categories/page.tsx
import ProtectedSidebar from "../ProtectedSidebar"
import CategoriesClient from "./CategoriesClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Manage Categories | Phulkari Bagh Admin",
  description: "Create, edit and delete categories",
}

async function getCategories() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rani-riwaaj-backend-ylbq.vercel.app"
  const res = await fetch(new URL("/api/categories", base).toString(), {
    cache: "no-store",
  })
  if (!res.ok) throw new Error("Failed to fetch categories")
  return res.json()
}

export default async function CategoriesPage() {
  const categories: Category[] = await getCategories()
  return (
      <CategoriesClient initialCategories={categories} />
  )
}
