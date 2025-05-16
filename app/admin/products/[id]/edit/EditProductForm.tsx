"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import clsx from "clsx";

/* -------------------------------------------------------------------------
 ✨ Schema ------------------------------------------------------------------
---------------------------------------------------------------------------*/
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z
    .string()
    .regex(/^\d+(,?\d+)*$/, "Use only numbers & commas (e.g. 1,499)")
    .transform((val) => val.replace(/,/g, "")),
  desc: z.string().min(1, "Description is required"),
  defaultImageUrl: z.string().url("Please enter a valid image URL"),
  colorsText: z.string().optional(),
  sizesText: z.string().optional(),
  badge: z.string().optional(),
  justIn: z.boolean().default(false),
  published: z.boolean().default(false),
});

export type FormValues = z.infer<typeof schema>;

/* -------------------------------------------------------------------------
 🔧 Utility -----------------------------------------------------------------
---------------------------------------------------------------------------*/
function splitCSV(value?: string) {
  return value
    ? value
        .split(/,\s*/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

interface Props {
  product: {
    _id: string;
    name: string;
    price: string;
    desc: string;
    defaultImage: { url: string };
    colors: string[];
    sizes: string[];
    badge: string;
    justIn: boolean;
    published: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

/* -------------------------------------------------------------------------
 🖌️ Field Component ---------------------------------------------------------
---------------------------------------------------------------------------*/
interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}
const Field = ({ label, error, children }: FieldProps) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
    </label>
    {children}
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

/* -------------------------------------------------------------------------
 🏗️  Form Component ---------------------------------------------------------
---------------------------------------------------------------------------*/
export default function EditProductForm({ product }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product.name,
      price: product.price,
      desc: product.desc,
      defaultImageUrl: product.defaultImage.url,
      colorsText: product.colors.join(", "),
      sizesText: product.sizes.join(", "),
      badge: product.badge,
      justIn: product.justIn,
      published: product.published,
    },
  });

  const previewUrl = watch("defaultImageUrl");

  async function onSubmit(data: FormValues) {
    const body = {
      name: data.name.trim(),
      price: data.price,
      desc: data.desc.trim(),
      defaultImage: { url: data.defaultImageUrl.trim() },
      colors: splitCSV(data.colorsText),
      sizes: splitCSV(data.sizesText),
      badge: data.badge?.trim() ?? "",
      justIn: data.justIn,
      published: data.published,
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/products/${product._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error(await res.text());

      toast.success("Product updated successfully ✨");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  /* -----------------------------------------------------------------------
   🔙-----------------------------------------------------------------------*/

  return (
    <section className="mx-auto mt-12 w-full max-w-4xl px-4 sm:px-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-richblack"
      >
        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Name" error={errors.name?.message}>
            <input
              type="text"
              {...register("name")}
              className="input"
            />
          </Field>

          <Field label="Price (₹)" error={errors.price?.message}>
            <input
              type="text"
              inputMode="numeric"
              {...register("price")}
              className="input"
            />
          </Field>

          <Field label="Colors (comma separated)">
            <input type="text" {...register("colorsText")} className="input" />
          </Field>

          <Field label="Sizes (comma separated)">
            <input type="text" {...register("sizesText")} className="input" />
          </Field>
        </div>

        {/* Description */}
        <Field label="Description" error={errors.desc?.message}>
          <textarea rows={4} {...register("desc")} className="input" />
        </Field>

        {/* Image + Preview */}
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          <Field
            label="Default Image URL"
            error={errors.defaultImageUrl?.message}
          >
            <input type="url" {...register("defaultImageUrl")} className="input" />
          </Field>

          <div className="flex justify-center md:justify-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="h-40 w-auto rounded border object-contain"
            />
          </div>
        </div>

        {/* Badge & Toggles */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Badge Label">
            <input type="text" {...register("badge")} className="input" />
          </Field>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("justIn")}/> Just In
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("published")}/> Published
            </label>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span>Created: {new Date(product.createdAt).toLocaleString()}</span>
          {" • "}
          <span>Updated: {new Date(product.updatedAt).toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className={clsx(
              "btn-primary flex-1",
              isSubmitting && "cursor-not-allowed opacity-60"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="btn-secondary flex-1"
          >
            <X className="mr-2 h-5 w-5" /> Cancel
          </button>
        </div>
      </form>

      {/* Tailwind component utilities --------------------------------------*/}
      <style jsx global>{`
        .input {
          @apply w-full rounded border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cerulean dark:bg-gray-800 dark:border-gray-700;
        }
        .btn-primary {
          @apply inline-flex items-center justify-center rounded bg-cerulean px-4 py-2 font-medium text-white hover:bg-cerulean/90;
        }
        .btn-secondary {
          @apply inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 font-medium hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700;
        }
      `}</style>
    </section>
  );
}
