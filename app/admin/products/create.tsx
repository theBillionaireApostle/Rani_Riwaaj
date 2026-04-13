"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2, PackagePlus } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "@/lib/error-utils";

interface UploadResponse {
  public_id: string;
  secure_url: string;
}

const BACKEND_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";

export default function CreateProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let secureUrl = "";
      let publicId = "";

      if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const uploadResponse = await fetch(`${BACKEND_BASE}/api/images/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Data,
            folder: "phulkari_products",
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Image upload failed.");
        }

        const uploadData: UploadResponse = await uploadResponse.json();
        secureUrl = uploadData.secure_url;
        publicId = uploadData.public_id;
      }

      const productResponse = await fetch(`${BACKEND_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultImage:
            secureUrl && publicId ? { url: secureUrl, publicId } : undefined,
          name,
          desc,
          globalImages:
            secureUrl && publicId ? [{ url: secureUrl, publicId }] : [],
          price: String(price),
        }),
      });

      if (!productResponse.ok) {
        throw new Error("Failed to create product.");
      }

      router.push("/admin/products");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rr-admin-page">
      <div className="rr-admin-pageIntro">
        <div className="rr-admin-pageLead">
          <span className="rr-admin-kicker">Catalog</span>
          <h1 className="rr-admin-pageTitle">New Product</h1>
          <p className="rr-admin-pageDescription">
            Add a new product to the live catalog.
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
        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Product details</h2>
              <p className="rr-admin-panelText">
                Enter the core fields first.
              </p>
            </div>
            <PackagePlus size={18} />
          </div>

          <form className="rr-admin-grid" onSubmit={handleSubmit}>
            {error ? <p className="rr-admin-fieldError">{error}</p> : null}

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Product name</span>
              <input
                className="rr-admin-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Price (INR)</span>
              <input
                className="rr-admin-input"
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
              />
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Description</span>
              <textarea
                className="rr-admin-textarea"
                value={desc}
                onChange={(event) => setDesc(event.target.value)}
                required
              />
            </label>

            <label className="rr-admin-field">
              <span className="rr-admin-fieldLabel">Product image</span>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <span className="rr-admin-fieldHint">
                A hero image is optional for this endpoint, but strongly recommended.
              </span>
            </label>

            <div className="rr-admin-formActions">
              <button
                type="submit"
                className="rr-admin-button rr-admin-button--primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="rr-admin-spin" />
                    Creating...
                  </>
                ) : (
                  "Create product"
                )}
              </button>
            </div>
          </form>
        </article>

        <article className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Visual check</h2>
              <p className="rr-admin-panelText">
                Confirm the hero image before saving.
              </p>
            </div>
            <ImagePlus size={18} />
          </div>

          {imageBase64 ? (
            <div className="rr-admin-mediaFrame">
              <Image
                src={imageBase64}
                alt="Product preview"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : (
            <div className="rr-admin-emptyState">
              <strong>No image selected yet</strong>
              <p>Add a product image to review how the hero asset will feel at a glance.</p>
            </div>
          )}

          <div className="rr-admin-listItem">
            <div className="rr-admin-listHeader">
              <div>
                <h3 className="rr-admin-listTitle">Before you save</h3>
                <p className="rr-admin-listSubtitle">
                  Check naming, pricing, and image quality.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
