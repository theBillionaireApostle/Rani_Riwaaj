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
    <div className="mx-auto my-12 w-full max-w-6xl rounded-xl border border-prussian/10 bg-white/80 px-4 py-8 shadow-lg backdrop-blur-sm md:px-10 lg:px-20">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-prussian dark:text-platinum">
        
      </h1>
      <EditProductForm product={product} />
    </div>
  );
}
