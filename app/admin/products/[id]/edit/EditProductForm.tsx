"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/error-utils";

const schema = z.object({
  badge: z.string().optional(),
  colorsText: z.string().optional(),
  defaultImageUrl: z.string().url("Please enter a valid image URL."),
  desc: z.string().min(1, "Description is required."),
  justIn: z.boolean().default(false),
  name: z.string().min(1, "Name is required."),
  price: z
    .string()
    .trim()
    .regex(
      /^(\d{1,3}(,?\d{3})*)(\.\d{1,2})?$/,
      "Use only numbers and commas, for example 1,499."
    )
    .transform((value) => value.replace(/,/g, "")),
  published: z.boolean().default(false),
  sizesText: z.string().optional(),
});

export type FormValues = z.infer<typeof schema>;

const PLACEHOLDER_IMAGE = "/images/placeholder.svg";

function splitCsv(value?: string) {
  return value?.split(/,\s*/).map((entry) => entry.trim()).filter(Boolean) ?? [];
}

interface Props {
  product: {
    _id: string;
    badge: string;
    colors: string[];
    createdAt: string;
    defaultImage: { url: string };
    desc: string;
    justIn: boolean;
    name: string;
    price: string;
    published: boolean;
    sizes: string[];
    updatedAt: string;
  };
}

export default function EditProductForm({ product }: Props) {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const [imageError, setImageError] = useState(false);

  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      badge: product.badge,
      colorsText: product.colors.join(", "),
      defaultImageUrl: product.defaultImage.url,
      desc: product.desc,
      justIn: product.justIn,
      name: product.name,
      price: product.price,
      published: product.published,
      sizesText: product.sizes.join(", "),
    },
    mode: "onBlur",
    resolver: zodResolver(schema),
  });

  const previewUrl = watch("defaultImageUrl");

  useEffect(() => {
    setImageError(false);
  }, [previewUrl]);

  async function onSubmit(values: FormValues) {
    if (!isDirty) {
      toast.info("No changes detected.");
      return;
    }

    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const response = await fetch(
        `https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${product._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            badge: values.badge?.trim() ?? "",
            colors: splitCsv(values.colorsText),
            defaultImage: { url: values.defaultImageUrl.trim() },
            desc: values.desc.trim(),
            justIn: values.justIn,
            name: values.name.trim(),
            price: Number(values.price),
            published: values.published,
            sizes: splitCsv(values.sizesText),
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success("Product updated successfully.");
      reset(undefined, { keepValues: true });
      router.push("/admin/products");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <section className="rr-admin-page">
      <div className="rr-admin-pageIntro">
        <div className="rr-admin-pageLead">
          <span className="rr-admin-kicker">Catalog</span>
          <h1 className="rr-admin-pageTitle">Edit Product</h1>
          <p className="rr-admin-pageDescription">
            Update product details and publish state.
          </p>
        </div>
        <div className="rr-admin-actions">
          <button
            type="button"
            className="rr-admin-button rr-admin-button--secondary"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      <div className="rr-admin-grid rr-admin-grid--2">
        <form className="rr-admin-panel rr-admin-grid" onSubmit={handleSubmit(onSubmit)}>
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Product details</h2>
              <p className="rr-admin-panelText">
                Update the essentials first.
              </p>
            </div>
          </div>

          <div className="rr-admin-formGrid">
            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Name</span>
              <input className="rr-admin-input" type="text" {...register("name")} />
              {errors.name ? (
                <span className="rr-admin-fieldError">{errors.name.message}</span>
              ) : null}
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Price (INR)</span>
              <input
                className="rr-admin-input"
                type="text"
                inputMode="numeric"
                {...register("price")}
              />
              {errors.price ? (
                <span className="rr-admin-fieldError">{errors.price.message}</span>
              ) : null}
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Colors</span>
              <input className="rr-admin-input" type="text" {...register("colorsText")} />
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Sizes</span>
              <input className="rr-admin-input" type="text" {...register("sizesText")} />
            </label>
          </div>

          <label className="rr-admin-field">
            <span className="rr-admin-fieldLabel">Description</span>
            <textarea className="rr-admin-textarea" rows={5} {...register("desc")} />
            {errors.desc ? (
              <span className="rr-admin-fieldError">{errors.desc.message}</span>
            ) : null}
          </label>

          <label className="rr-admin-field">
            <span className="rr-admin-fieldLabel">Default image URL</span>
            <input className="rr-admin-input" type="url" {...register("defaultImageUrl")} />
            {errors.defaultImageUrl ? (
              <span className="rr-admin-fieldError">
                {errors.defaultImageUrl.message}
              </span>
            ) : null}
          </label>

          <label className="rr-admin-field">
            <span className="rr-admin-fieldLabel">Badge</span>
            <input className="rr-admin-input" type="text" {...register("badge")} />
          </label>

          <div className="rr-admin-toggleGroup">
            <label className="rr-admin-checkbox">
              <input type="checkbox" {...register("justIn")} />
              <span>Mark as just in</span>
            </label>
            <label className="rr-admin-checkbox">
              <input type="checkbox" {...register("published")} />
              <span>Published</span>
            </label>
          </div>

          <p className="rr-admin-mutedText">
            Created {new Date(product.createdAt).toLocaleString()} and last updated{" "}
            {new Date(product.updatedAt).toLocaleString()}.
          </p>

          <div className="rr-admin-formActions">
            <button
              type="submit"
              className="rr-admin-button rr-admin-button--primary"
              disabled={isSubmitting || !isDirty}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="rr-admin-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save changes
                </>
              )}
            </button>
            <button
              type="button"
              className="rr-admin-button rr-admin-button--ghost"
              onClick={() => router.back()}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>

        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Visual preview</h2>
              <p className="rr-admin-panelText">
                Validate the hero image and current publish state.
              </p>
            </div>
            <span
              className={`rr-admin-badge ${
                watch("published")
                  ? "rr-admin-badge--success"
                  : "rr-admin-badge--warning"
              }`}
            >
              {watch("published") ? "Published" : "Draft"}
            </span>
          </div>

          <div className="rr-admin-mediaFrame">
            <Image
              src={imageError ? PLACEHOLDER_IMAGE : previewUrl}
              alt="Product preview"
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              style={{ objectFit: "cover" }}
              onError={() => setImageError(true)}
            />
          </div>

          <div className="rr-admin-listItem">
            <div className="rr-admin-listHeader">
              <div>
                <h3 className="rr-admin-listTitle">Review checklist</h3>
                <p className="rr-admin-listSubtitle">
                  Check image quality, copy, and pricing before publishing.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
