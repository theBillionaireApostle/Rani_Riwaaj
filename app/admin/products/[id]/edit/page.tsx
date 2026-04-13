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

  return <EditProductForm product={product} />;
}
