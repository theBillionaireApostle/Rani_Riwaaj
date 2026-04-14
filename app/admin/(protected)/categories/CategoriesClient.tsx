"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import styles from "./CategoriesClient.module.css";
import { getErrorMessage } from "@/lib/error-utils";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string; publicId: string };
}

interface ProductPreview {
  _id: string;
  category?: string;
  name: string;
  price: string | number;
  desc?: string;
  defaultImage?: { url?: string };
  published?: boolean;
}

interface Props {
  initialCategories: Category[];
}

interface CategoryPayload {
  description?: string;
  imageBase64?: string;
  name: string;
  slug: string;
}

const BACKEND_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("admin_jwt") ?? "" : "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [allProducts, setAllProducts] = useState<ProductPreview[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Partial<Category>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const perPage = 6;

  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/products`, {
      headers: authHeaders(),
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Failed to load products"))
      )
      .then((data: ProductPreview[]) => setAllProducts(data))
      .catch((err: unknown) =>
        toast.error(getErrorMessage(err, "Could not load category coverage data."))
      );
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;

    setLoadingProducts(true);
    fetch(`${BACKEND_BASE}/api/products?category=${selectedCategory.slug}`, {
      headers: authHeaders(),
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("Failed to load products"))
      )
      .then((data: ProductPreview[]) => setProducts(data))
      .catch((err: unknown) => toast.error(getErrorMessage(err)))
      .finally(() => setLoadingProducts(false));
  }, [selectedCategory]);

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        [category.name, category.slug, category.description]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(search.trim().toLowerCase())
          )
      ),
    [categories, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / perPage));
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const visibleCategories = useMemo(
    () => filteredCategories.slice((page - 1) * perPage, page * perPage),
    [filteredCategories, page]
  );

  const categoriesWithImages = categories.filter((category) => category.image?.url).length;
  const categoriesWithDescription = categories.filter(
    (category) => (category.description ?? "").trim().length > 0
  ).length;
  const categoryMetrics = useMemo(() => {
    const metrics = new Map<string, { total: number; live: number; draft: number }>();

    categories.forEach((category) => {
      metrics.set(category._id, { total: 0, live: 0, draft: 0 });
    });

    allProducts.forEach((product) => {
      if (!product.category) return;
      const current = metrics.get(product.category) ?? { total: 0, live: 0, draft: 0 };
      current.total += 1;
      if (product.published) {
        current.live += 1;
      } else {
        current.draft += 1;
      }
      metrics.set(product.category, current);
    });

    return metrics;
  }, [allProducts, categories]);
  const mappedCategoriesCount = useMemo(
    () =>
      categories.filter((category) => (categoryMetrics.get(category._id)?.total ?? 0) > 0).length,
    [categories, categoryMetrics]
  );

  const resetModal = useCallback(() => {
    setModalOpen(false);
    setIsEditing(false);
    setDraft({});
    setImageFile(null);
    setPreviewUrl(null);
    setError("");
  }, []);

  const openAdd = () => {
    setIsEditing(false);
    setDraft({});
    setImageFile(null);
    setPreviewUrl(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setIsEditing(true);
    setDraft(category);
    setImageFile(null);
    setPreviewUrl(category.image?.url ?? null);
    setError("");
    setModalOpen(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : draft.image?.url ?? null);
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1] || "");
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const name = draft.name?.trim();
      const slug = draft.slug?.trim();

      if (!name || !slug) {
        setError("Name and slug are required.");
        return;
      }

      setLoading(true);

      try {
        const payload: CategoryPayload = {
          name,
          slug,
          description: draft.description?.trim() || undefined,
        };

        if (imageFile) {
          payload.imageBase64 = await fileToBase64(imageFile);
        }

        const response = await fetch(
          isEditing
            ? `${BACKEND_BASE}/api/categories/${draft._id}`
            : `${BACKEND_BASE}/api/categories`,
          {
            method: isEditing ? "PATCH" : "POST",
            headers: authHeaders(),
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const savedCategory: Category = await response.json();

        setCategories((current) =>
          isEditing
            ? current.map((category) =>
                category._id === savedCategory._id ? savedCategory : category
              )
            : [savedCategory, ...current]
        );

        toast.success(`Category ${isEditing ? "updated" : "created"} successfully.`);
        resetModal();
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [draft, imageFile, isEditing, resetModal]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const response = await fetch(`${BACKEND_BASE}/api/categories/${deleteTarget._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setCategories((current) =>
        current.filter((category) => category._id !== deleteTarget._id)
      );
      setDeleteTarget(null);
      toast.success("Category deleted.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Delete failed."));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  if (selectedCategory) {
    const liveProducts = products.filter((product) => product.published).length;
    const draftProducts = products.length - liveProducts;

    return (
      <section className="rr-admin-page">
        <div className="rr-admin-pageIntro">
          <div className="rr-admin-pageLead">
            <span className="rr-admin-kicker">Category View</span>
            <h1 className="rr-admin-pageTitle">{selectedCategory.name}</h1>
            <p className="rr-admin-pageDescription">
              Review mapped products, live coverage, and editing priorities for /
              {selectedCategory.slug}.
            </p>
          </div>
          <div className="rr-admin-actions">
            <button
              type="button"
              className="rr-admin-button rr-admin-button--secondary"
              onClick={() => setSelectedCategory(null)}
            >
              <ArrowLeft size={16} />
              Back to categories
            </button>
          </div>
        </div>

        <div className="rr-admin-statGrid">
          <article className="rr-admin-statCard">
            <span className="rr-admin-statLabel">Products</span>
            <strong className="rr-admin-statValue">{products.length}</strong>
            <span className="rr-admin-statMeta">Currently linked to this category.</span>
          </article>
          <article className="rr-admin-statCard">
            <span className="rr-admin-statLabel">Live</span>
            <strong className="rr-admin-statValue">{liveProducts}</strong>
            <span className="rr-admin-statMeta">Published products in this category.</span>
          </article>
          <article className="rr-admin-statCard">
            <span className="rr-admin-statLabel">Draft</span>
            <strong className="rr-admin-statValue">{draftProducts}</strong>
            <span className="rr-admin-statMeta">Products still waiting on publish readiness.</span>
          </article>
          <article className="rr-admin-statCard">
            <span className="rr-admin-statLabel">Cover image</span>
            <strong className="rr-admin-statValue">
              {selectedCategory.image?.url ? "Ready" : "Pending"}
            </strong>
            <span className="rr-admin-statMeta">Visual identity for the category.</span>
          </article>
        </div>

        <div className="rr-admin-panel">
          <div className="rr-admin-panelHeader">
            <div>
              <h2 className="rr-admin-panelTitle">Products in this category</h2>
              <p className="rr-admin-panelText">
                Use this view to validate mapping quality and move straight into a
                specific product edit when required.
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="rr-admin-emptyState">
              <strong>Loading products</strong>
              <p>Fetching the latest catalog items for this category.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rr-admin-emptyState">
              <strong>No products mapped here yet</strong>
              <p>Add or recategorize products to make this section useful.</p>
            </div>
          ) : (
            <div className={styles.productGrid}>
              {products.map((product) => (
                <article key={product._id} className={styles.productCard}>
                  <div className={styles.productImage}>
                    <Image
                      src={product.defaultImage?.url || "/images/phulkari_bag.webp"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.productBody}>
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.desc || "Description pending."}</p>
                    </div>
                    <div className={styles.productFooter}>
                      <span
                        className={`rr-admin-badge ${
                          product.published
                            ? "rr-admin-badge--success"
                            : "rr-admin-badge--warning"
                        }`}
                      >
                        {product.published ? "Published" : "Draft"}
                      </span>
                      <strong>₹{product.price}</strong>
                    </div>
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="rr-admin-button rr-admin-button--secondary"
                    >
                      Edit product
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="rr-admin-page">
      <div className="rr-admin-pageIntro">
        <div className="rr-admin-pageLead">
          <span className="rr-admin-kicker">Structure</span>
          <h1 className="rr-admin-pageTitle">Categories</h1>
          <p className="rr-admin-pageDescription">
            Keep category structure clean, merchandised, and mapped to live products.
          </p>
        </div>
        <div className="rr-admin-actions">
          <button
            type="button"
            className="rr-admin-button rr-admin-button--primary"
            onClick={openAdd}
          >
            <Plus size={16} />
            New category
          </button>
        </div>
      </div>

      <div className="rr-admin-statGrid">
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Categories</span>
          <strong className="rr-admin-statValue">{categories.length}</strong>
          <span className="rr-admin-statMeta">Current active category records.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">With imagery</span>
          <strong className="rr-admin-statValue">{categoriesWithImages}</strong>
          <span className="rr-admin-statMeta">Categories that already have cover imagery.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">With description</span>
          <strong className="rr-admin-statValue">{categoriesWithDescription}</strong>
          <span className="rr-admin-statMeta">Useful for context and SEO.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">In use</span>
          <strong className="rr-admin-statValue">{mappedCategoriesCount}</strong>
          <span className="rr-admin-statMeta">Categories already linked to products.</span>
        </article>
      </div>

      <div className="rr-admin-panel">
        <div className="rr-admin-toolbar">
          <label className="rr-admin-search">
            <span className="rr-admin-searchLabel">Search categories</span>
            <div className={styles.searchField}>
              <Search size={18} />
              <input
                className="rr-admin-input"
                type="text"
                placeholder="Search by name, slug, or description"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
          </label>

          <button
            type="button"
            className="rr-admin-button rr-admin-button--secondary"
            onClick={openAdd}
          >
            <Plus size={16} />
            Add category
          </button>
        </div>

        {visibleCategories.length === 0 ? (
          <div className="rr-admin-emptyState">
            <FolderTree size={28} />
            <strong>
              {search ? "No categories match the current search." : "No categories yet."}
            </strong>
            <p>
              {search
                ? "Adjust the search to explore the current structure."
                : "Create the first category to begin organizing the catalog."}
            </p>
          </div>
        ) : (
          <div className={styles.categoryGrid}>
            {visibleCategories.map((category) => {
              const metrics = categoryMetrics.get(category._id) ?? {
                total: 0,
                live: 0,
                draft: 0,
              };

              return (
                <article key={category._id} className={styles.categoryCard}>
                  <button
                    type="button"
                    className={styles.categoryMedia}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Image
                      src={category.image?.url || "/cat-placeholder.png"}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 280px"
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                  <div className={styles.categoryBody}>
                    <div className={styles.categoryHeader}>
                      <div>
                        <h3>{category.name}</h3>
                        <p>/{category.slug}</p>
                      </div>
                      <div className={styles.categoryActions}>
                        <button
                          type="button"
                          className="rr-admin-iconButton"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="rr-admin-iconButton"
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className={styles.categoryText}>
                      {category.description || "No description added yet."}
                    </p>
                    <div className={styles.categoryMetrics}>
                      <div className={styles.categoryMetric}>
                        <span className={styles.categoryMetricLabel}>Products</span>
                        <strong className={styles.categoryMetricValue}>{metrics.total}</strong>
                      </div>
                      <div className={styles.categoryMetric}>
                        <span className={styles.categoryMetricLabel}>Live</span>
                        <strong className={styles.categoryMetricValue}>{metrics.live}</strong>
                      </div>
                      <div className={styles.categoryMetric}>
                        <span className={styles.categoryMetricLabel}>Draft</span>
                        <strong className={styles.categoryMetricValue}>{metrics.draft}</strong>
                      </div>
                    </div>
                    <div className={styles.categoryFooter}>
                      <div className={styles.categoryMetaRail}>
                        <span
                          className={`rr-admin-badge ${
                            category.image?.url
                              ? "rr-admin-badge--success"
                              : "rr-admin-badge--warning"
                          }`}
                        >
                          {category.image?.url ? "Image ready" : "Image pending"}
                        </span>
                        <span
                          className={`rr-admin-badge ${
                            metrics.total > 0
                              ? "rr-admin-badge--info"
                              : "rr-admin-badge--warning"
                          }`}
                        >
                          {metrics.total > 0 ? "Mapped to catalog" : "No products yet"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="rr-admin-button rr-admin-button--secondary"
                        onClick={() => setSelectedCategory(category)}
                      >
                        Open desk
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.pagination}>
          <button
            type="button"
            className="rr-admin-button rr-admin-button--secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rr-admin-button rr-admin-button--secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen ? (
        <div className="rr-admin-modalBackdrop">
          <div className="rr-admin-modal">
            <div className="rr-admin-modalHeader">
              <h2 className="rr-admin-modalTitle">
                {isEditing ? "Edit category" : "Create category"}
              </h2>
              <button
                type="button"
                className="rr-admin-iconButton"
                onClick={resetModal}
              >
                <X size={16} />
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleSubmit}>
              {error ? <p className="rr-admin-fieldError">{error}</p> : null}

              <label className="rr-admin-field">
                <span className="rr-admin-fieldLabel">Name</span>
                <input
                  className="rr-admin-input"
                  type="text"
                  value={draft.name || ""}
                  onChange={(event) =>
                    setDraft((current) => {
                      const name = event.target.value;
                      const existingSlug = current.slug || "";
                      const shouldSyncSlug =
                        !isEditing || !existingSlug || existingSlug === slugify(current.name || "");

                      return {
                        ...current,
                        name,
                        slug: shouldSyncSlug ? slugify(name) : existingSlug,
                      };
                    })
                  }
                  required
                />
              </label>

              <label className="rr-admin-field">
                <span className="rr-admin-fieldLabel">Slug</span>
                <input
                  className="rr-admin-input"
                  type="text"
                  value={draft.slug || ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))
                  }
                  required
                />
              </label>

              <label className="rr-admin-field">
                <span className="rr-admin-fieldLabel">Description</span>
                <textarea
                  className="rr-admin-textarea"
                  value={draft.description || ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>

              <label className="rr-admin-field">
                <span className="rr-admin-fieldLabel">
                  Cover image {isEditing ? "(optional)" : ""}
                </span>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </label>

              {previewUrl ? (
                <div className={styles.preview}>
                  <Image
                    src={previewUrl}
                    alt="Category preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ) : null}

              <div className="rr-admin-modalActions">
                <button
                  type="button"
                  className="rr-admin-button rr-admin-button--ghost"
                  onClick={resetModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rr-admin-button rr-admin-button--primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : isEditing ? "Save changes" : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {deleteTarget ? (
        <div className="rr-admin-modalBackdrop">
          <div className="rr-admin-modal">
            <div className="rr-admin-modalHeader">
              <div>
                <h2 className="rr-admin-modalTitle">Delete category</h2>
                <p className="rr-admin-panelText">
                  Remove <strong>{deleteTarget.name}</strong> from the admin taxonomy. Products
                  currently mapped here may need recategorization afterward.
                </p>
              </div>
              <button
                type="button"
                className="rr-admin-iconButton"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                <X size={16} />
              </button>
            </div>

            <div className="rr-admin-modalActions">
              <button
                type="button"
                className="rr-admin-button rr-admin-button--ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rr-admin-button rr-admin-button--danger"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete category"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
