// app/admin/products/[id]/page.tsx
import EditProductForm from "./EditProductForm";
import { notFound } from "next/navigation";

export const revalidate = 0;

async function fetchProduct(id: string) {
  const res = await fetch(
    `https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("not found");
  return res.json();
}

export default async function EditPage({
  params,
}: {
  params: { id: string };
}) {
  let product;
  try {
    product = await fetchProduct(params.id);
  } catch {
    return notFound();
  }

  return (
    <div className="max-w-lg mx-auto my-12 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Edit “{product.name}”</h1>
      <EditProductForm product={product} />
    </div>
  );
}
