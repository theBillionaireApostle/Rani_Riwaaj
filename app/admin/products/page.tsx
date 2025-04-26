// app/admin/products/page.tsx
"use client";
import Link from "next/link"

// 1. Server-side function to fetch product data
async function getProducts() {
  // Adjust the fetch URL if needed. 
  // Using { cache: "no-store" } ensures data is always fresh in the admin panel.
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/products`, {
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  return res.json()
}

export default async function AdminProductsPage() {
  // 2. Fetch products on the server side
  const products = await getProducts()

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Products</h1>

      {/* Link to a page/form for creating a new product */}
      <div style={{ margin: "1rem 0" }}>
        <Link href="/admin/products/create">Create New Product</Link>
      </div>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {products.map((product: any) => (
            <li
              key={product._id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <h2 style={{ margin: 0 }}>{product.name}</h2>
              <p>Price: {product.price}</p>
              <p style={{ marginBottom: "0.5rem" }}>{product.desc}</p>

              {/* Example edit/delete actions */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href={`/admin/products/${product._id}/edit`}>
                  Edit
                </Link>
                <button
                  onClick={async () => {
                    // Example of how you might delete a product:
                    // await fetch(`/api/products/${product._id}`, { method: "DELETE" })
                    // Then trigger a re-fetch or refresh to update the list
                    alert("Delete logic not implemented yet.")
                  }}
                  style={{ color: "red" }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}