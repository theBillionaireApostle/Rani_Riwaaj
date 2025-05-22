/* -----------------------------------------------------------------------------
   ✨  EditProductForm – ultimate polish: heading, back button, aligned icons
   ----------------------------------------------------------------------------- */

   "use client";

   import React, { useEffect, useRef, useState } from "react";
   import Link from "next/link";
   import { useRouter } from "next/navigation";
   import { useForm } from "react-hook-form";
   import { zodResolver } from "@hookform/resolvers/zod";
   import * as z from "zod";
   import { Save, X, Loader2, ArrowLeft } from "lucide-react";
   import { toast } from "react-toastify";
   import clsx from "clsx";
   
   /* ------------------------------ Schema ------------------------------ */
   const schema = z.object({
     name: z.string().min(1, "Name is required"),
     price: z
       .string()
       .trim()
       .regex(/^(\d{1,3}(,?\d{3})*)(\.\d{1,2})?$/, "Use only numbers & commas (e.g. 1,499)")
       .transform((v) => v.replace(/,/g, "")),
     desc: z.string().min(1, "Description is required"),
     defaultImageUrl: z.string().url("Please enter a valid image URL"),
     colorsText: z.string().optional(),
     sizesText: z.string().optional(),
     badge: z.string().optional(),
     justIn: z.boolean().default(false),
     published: z.boolean().default(false),
   });
   export type FormValues = z.infer<typeof schema>;
   
   /* ------------------------------ Helpers ----------------------------- */
   const splitCSV = (value?: string) => value?.split(/,\s*/).map((s) => s.trim()).filter(Boolean) ?? [];
   const PLACEHOLDER_IMG = "/images/placeholder.svg";
   
   /* ------------------------------ Field ------------------------------- */
   interface FieldProps { label: string; error?: string; children: React.ReactNode }
   const Field = ({ label, error, children }: FieldProps) => (
     <div className="flex w-full flex-col gap-1">
       <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>
       {children}
       {error && <span className="text-xs text-red-600">{error}</span>}
     </div>
   );
   
   /* ------------------------------ Component --------------------------- */
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
   export default function EditProductForm({ product }: Props) {
     const router = useRouter();
     const abortRef = useRef<AbortController | null>(null);
     const {
       register,
       handleSubmit,
       formState: { errors, isSubmitting, isDirty },
       watch,
       reset,
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
       mode: "onBlur",
     });
   
     const previewUrl = watch("defaultImageUrl");
     const [imgError, setImgError] = useState(false);
   
     useEffect(() => setImgError(false), [previewUrl]);
   
     async function onSubmit(data: FormValues) {
       if (!isDirty) {
         toast.info("No changes detected");
         return;
       }
       const body = {
         name: data.name.trim(),
         price: Number(data.price),
         desc: data.desc.trim(),
         defaultImage: { url: data.defaultImageUrl.trim() },
         colors: splitCSV(data.colorsText),
         sizes: splitCSV(data.sizesText),
         badge: data.badge?.trim() ?? "",
         justIn: data.justIn,
         published: data.published,
       };
       try {
         abortRef.current?.abort();
         abortRef.current = new AbortController();
         const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${product._id}`, {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(body),
           signal: abortRef.current.signal,
         });
         if (!res.ok) throw new Error(await res.text());
         toast.success("Product updated ✨", { autoClose: 2500 });
         reset(undefined, { keepValues: true });
         router.push("/admin/products");
       } catch (err: any) {
         if (err.name !== "AbortError") toast.error(err.message || "Something went wrong");
       }
     }
   
     /* ------------------------------ UI ------------------------------- */
     return (
       <section className="mx-auto mt-12 w-full max-w-4xl px-4 sm:px-8">
         {/* Header */}
         <div className="mb-6 flex items-center gap-4">
         <button onClick={() => router.back()} aria-label="Go back"  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700">
             <ArrowLeft className="h-5 w-5" />
           </button>
           <h1 className="text-2xl font-semibold tracking-tight text-prussian dark:text-platinum">Edit Product</h1>
         </div>
   
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-richblack">
           {/* Basics */}
           <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
             <Field label="Name" error={errors.name?.message}>
               <input type="text" {...register("name")} className={clsx("input", errors.name && "input-error")} />
             </Field>
             <Field label="Price (₹)" error={errors.price?.message}>
               <input type="text" inputMode="numeric" {...register("price")} className={clsx("input", errors.price && "input-error")} />
             </Field>
             <Field label="Colors (comma-separated)">
               <input type="text" {...register("colorsText")} className="input" />
             </Field>
             <Field label="Sizes (comma-separated)">
               <input type="text" {...register("sizesText")} className="input" />
             </Field>
           </div>
   
           {/* Description */}
           <Field label="Description" error={errors.desc?.message}>
             <textarea rows={4} {...register("desc")} className={clsx("input", errors.desc && "input-error")} />
           </Field>
   
           {/* Image */}
           <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
             <Field label="Default Image URL" error={errors.defaultImageUrl?.message}>
               <input type="url" {...register("defaultImageUrl")} className={clsx("input", errors.defaultImageUrl && "input-error")} />
             </Field>
             <div className="flex justify-center md:justify-start">
               <img src={imgError ? PLACEHOLDER_IMG : previewUrl} alt="Preview" className="h-40 w-auto rounded border object-contain" onError={() => setImgError(true)} />
             </div>
           </div>
   
           {/* Badge & Toggles */}
           <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
             <Field label="Badge Label (optional)">
               <input type="text" {...register("badge")} className="input" />
             </Field>
             <div className="flex flex-wrap items-center gap-6 pt-8 md:pt-2 text-sm">
               <label className="flex items-center gap-2"><input type="checkbox" {...register("justIn")} /> <span>Just In</span></label>
               <label className="flex items-center gap-2"><input type="checkbox" {...register("published")} /> <span>Published</span></label>
             </div>
           </div>
   
           {/* Timestamps */}
           <p className="text-xs text-gray-500 dark:text-gray-400">Created {new Date(product.createdAt).toLocaleString()} • Updated {new Date(product.updatedAt).toLocaleString()}</p>
   
           {/* Action Buttons */}
           <div className="flex flex-col gap-4 sm:flex-row">
  {/* ── Save ── */}
  <button
    type="submit"
    disabled={isSubmitting || !isDirty}
    className={clsx(
      "flex flex-1 items-center justify-center gap-2 rounded px-4 py-2 font-medium text-white transition",
      // enabled
      !(isSubmitting || !isDirty) && "bg-blue-600 hover:bg-blue-700",
      // disabled
      (isSubmitting || !isDirty) && "bg-blue-400 cursor-not-allowed"
    )}
  >
    {isSubmitting ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : (
      <Save className="h-5 w-5" />
    )}
    <span>Save&nbsp;Changes</span>
  </button>

  {/* ── Cancel (back) ── */}
  <button
    type="button"
    onClick={() => router.back()}
    className="flex flex-1 items-center justify-center gap-2 rounded border border-blue-600 px-4 py-2 font-medium text-blue-600 transition hover:bg-blue-50"
  >
    <X className="h-5 w-5" />
    <span>Cancel</span>
  </button>
</div>
         </form>
   
         {/* Tailwind util overrides */}
         <style jsx global>{`
           .input {
             @apply w-full rounded border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cerulean dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-cerulean/80;
           }
           .input-error {
             @apply border-red-500 focus:ring-red-500;
           }
           .btn-base {
             @apply inline-flex items-center justify-center gap-2 whitespace-nowrap rounded px-4 py-2 font-medium transition;
           }
           .btn-primary {
             @apply btn-base bg-cerulean text-white hover:bg-cerulean/90;
           }
           .btn-danger {
             @apply btn-base bg-red-600 text-white hover:bg-red-700;
           }
         `}</style>
       </section>
     );
   }
   
