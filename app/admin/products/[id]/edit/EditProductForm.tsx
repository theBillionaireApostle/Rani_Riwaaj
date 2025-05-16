// app/admin/products/[id]/EditProductForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Loader2 } from "lucide-react";

interface Props {
  product: {
    _id: string;
    name: string;
    price: string;       // e.g. "1,499"
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

  const initialPrice = product.price.replace(/,/g, "");

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(initialPrice);
  const [desc, setDesc] = useState(product.desc);
  const [defaultImageUrl, setDefaultImageUrl] = useState(product.defaultImage.url);
  const [colorsText, setColorsText] = useState(product.colors.join(", "));
  const [sizesText, setSizesText] = useState(product.sizes.join(", "));
  const [badge, setBadge] = useState(product.badge);
  const [justIn, setJustIn] = useState(product.justIn);
  const [published, setPublished] = useState(product.published);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name,
      price,
      desc,
      defaultImage: { url: defaultImageUrl },
      colors: colorsText.split(",").map((s) => s.trim()).filter(Boolean),
      sizes: sizesText.split(",").map((s) => s.trim()).filter(Boolean),
      badge,
      justIn,
      published,
    };

    try {
      const res = await fetch(
        `http://localhost:5005/api/products/${product._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      router.push("/admin/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-12">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-8 py-6 border-b">
          <h1 className="text-2xl font-semibold">Edit “{product.name}”</h1>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          {error && (
            <div className="text-red-700 bg-red-100 p-3 rounded">{error}</div>
          )}

          {/* two-column grid on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (₹)</label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* full-width description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* two-column for image URL & preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-sm font-medium mb-1">
                Default Image URL
              </label>
              <input
                type="url"
                value={defaultImageUrl}
                onChange={(e) => setDefaultImageUrl(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex justify-center md:justify-start">
              <img
                src={defaultImageUrl}
                alt="Preview"
                className="h-40 object-contain rounded border"
              />
            </div>
          </div>

          {/* two-column colors & sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Colors (comma separated)
              </label>
              <input
                type="text"
                value={colorsText}
                onChange={(e) => setColorsText(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Sizes (comma separated)
              </label>
              <input
                type="text"
                value={sizesText}
                onChange={(e) => setSizesText(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* badge */}
          <div>
            <label className="block text-sm font-medium mb-1">Badge Label</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={justIn}
                onChange={(e) => setJustIn(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Just In</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <span className="text-sm">Published</span>
            </label>
          </div>

          {/* timestamps */}
          <div className="text-xs text-gray-500">
            <div>Created: {new Date(product.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(product.updatedAt).toLocaleString()}</div>
          </div>

          {/* actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 inline-flex items-center justify-center py-2 rounded text-white ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="flex-1 inline-flex items-center justify-center py-2 rounded border border-gray-300 hover:bg-gray-100"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
