"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  memo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Eye,
  PencilLine,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/error-utils";
import styles from "./Dashboard.module.css";

// Product type definition.
export interface Product {
  _id: string;
  name: string;
  desc: string;
  price: string;
  published?: boolean;
  justIn?: boolean;
  defaultImage?: { url: string; publicId: string };
  colors?: string[];
  sizes?: string[];
  badge?: string;
  category?: string;
  tags?: string[];
}

interface DashboardProps {
  products: Product[];
  categoryCount: number;
  tagCount: number;
  issues: string[];
}

type FormFieldValue =
  | string
  | boolean
  | string[]
  | (File | null)[]
  | { [color: string]: File[] };

function parsePrice(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number.parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
}

export default function Dashboard({
  products: initialProducts,
  categoryCount,
  tagCount,
  issues,
}: DashboardProps) {
  // Global states.
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const itemsPerPage = 5;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  // Modal state for adding/editing a product.
  const [modalOpen, setModalOpen] = useState(false);
  const [imageCount, setImageCount] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formValues, setFormValues] = useState({
    name: "",
    desc: "",
    price: "",
    images: Array<File | null>(5).fill(null),
    colors: [] as string[],
    sizes: [] as string[],
    badge: "",
    published: false,
    colorImages: {} as { [color: string]: File[] },
    categoryId: "",  
  });
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  // New state: enable swatches (optional feature)
  const [swatchesEnabled, setSwatchesEnabled] = useState(false);

  // Offline detection state.
  const [isOffline, setIsOffline] = useState(false);
  const offlineToastDisplayed = useRef(false);

  // State for current color (for adding a new swatch).
  const [currentColor, setCurrentColor] = useState<string>("#000000");
  // State for tracking which swatch is active.
  const [activeSwatch, setActiveSwatch] = useState<string | null>(null);

  // --- Offline Detection ---
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      if (!offlineToastDisplayed.current) {
        toast.warn("You appear to be offline. Some functionalities may be limited.", {
          toastId: "offline-warning",
          autoClose: 3000,
        });
        offlineToastDisplayed.current = true;
      }
    };
    const handleOnline = () => {
      setIsOffline(false);
      toast.dismiss("offline-warning");
      offlineToastDisplayed.current = false;
      if (!toast.isActive("online-success")) {
        toast.success("You are back online!", {
          toastId: "online-success",
          autoClose: 3000,
        });
      }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);


  // fetch categories for the dropdown
useEffect(() => {
  (async () => {
    try {
      const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Could not load categories."));
    }
  })();
}, []);

useEffect(() => {
  function onClickOutside(e: MouseEvent) {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  }
  document.addEventListener("mousedown", onClickOutside);
  return () => document.removeEventListener("mousedown", onClickOutside);
}, []);

const filteredCategories = useMemo(() => {
  if (!categorySearch) return categories;
  return categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
}, [categories, categorySearch]);

  // --- Filtering & Pagination ---
  const filteredProducts = useMemo(() =>
    products.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(totalPages, 1)));
  }, [totalPages]);

  const publishedCount = useMemo(
    () => products.filter((product) => product.published).length,
    [products]
  );
  const draftCount = products.length - publishedCount;
  const withImageCount = useMemo(
    () => products.filter((product) => Boolean(product.defaultImage?.url)).length,
    [products]
  );
  const withCategoryCount = useMemo(
    () => products.filter((product) => Boolean(product.category)).length,
    [products]
  );
  const withTagsCount = useMemo(
    () => products.filter((product) => (product.tags?.length ?? 0) > 0).length,
    [products]
  );
  const withVariantsCount = useMemo(
    () =>
      products.filter(
        (product) => (product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0
      ).length,
    [products]
  );
  const justInCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.justIn ||
          product.badge?.toLowerCase().includes("just") ||
          product.badge?.toLowerCase().includes("new")
      ).length,
    [products]
  );
  const catalogValue = useMemo(
    () => products.reduce((sum, product) => sum + parsePrice(product.price), 0),
    [products]
  );
  const averagePrice = products.length
    ? Math.round(catalogValue / products.length)
    : 0;
  const imageCoverage = products.length
    ? Math.round((withImageCount / products.length) * 100)
    : 0;
  const publishedCoverage = products.length
    ? Math.round((publishedCount / products.length) * 100)
    : 0;
  const categoryCoverage = products.length
    ? Math.round((withCategoryCount / products.length) * 100)
    : 0;
  const tagCoverage = products.length
    ? Math.round((withTagsCount / products.length) * 100)
    : 0;
  const merchandisingCoverage = products.length
    ? Math.round((withVariantsCount / products.length) * 100)
    : 0;

  const spotlightProducts = useMemo(
    () =>
      [...products]
        .sort((left, right) => parsePrice(right.price) - parsePrice(left.price))
        .slice(0, 3),
    [products]
  );
  const attentionQueue = useMemo(
    () =>
      products
        .filter(
          (product) =>
            !product.published ||
            !product.defaultImage?.url ||
            !(product.desc ?? "").trim() ||
            !product.category
        ),
    [products]
  );
  const attentionQueueCount = attentionQueue.length;
  const attentionProducts = useMemo(() => attentionQueue.slice(0, 4), [attentionQueue]);
  const heroSummary = attentionQueueCount
    ? `${products.length} products, ${publishedCount} live, ${draftCount} drafts. ${attentionQueueCount} ${
        attentionQueueCount === 1 ? "item needs" : "items need"
      } publishing cleanup.`
    : `${products.length} products, ${publishedCount} live, ${draftCount} drafts. The catalog is structurally ready for the next merchandising push.`;
  const heroSignals = [
    {
      label: "Publishing",
      value: `${publishedCoverage}%`,
      detail: `${publishedCount} products live`,
    },
    {
      label: "Taxonomy",
      value: `${categoryCoverage}%`,
      detail: `${withCategoryCount} category-linked`,
    },
    {
      label: "Merchandising",
      value: `${merchandisingCoverage}%`,
      detail: `${withVariantsCount} with variants`,
    },
  ];

  // --- Handlers ---
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalError("");
    setFormValues({
      name: "",
      desc: "",
      price: "",
      images: Array<File | null>(5).fill(null),
      colors: [],
      sizes: [],
      badge: "",
      published: false,
      categoryId: "", 
      colorImages: {},
    });
    setCategorySearch("");
    setActiveSwatch(null);
  }, []);

  const handleFieldChange = useCallback((field: string, value: FormFieldValue) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const newFiles = Array.from(event.target.files).slice(0, 5);
    if (newFiles.length === 0) return;

    setImageCount((prev) => {
      const next = Math.min(5, Math.max(prev, newFiles.length)) as 1 | 2 | 3 | 4 | 5;
      return next;
    });

    setFormValues((prev) => {
      const nextSlots = [...prev.images];
      let pointer = 0;
      for (const file of newFiles) {
        while (pointer < 5 && nextSlots[pointer]) pointer++;
        if (pointer < 5) nextSlots[pointer] = file;
      }
      return { ...prev, images: nextSlots };
    });
  };

  const handleImageCountChange = (count: number) => {
    setImageCount(count as 1 | 2 | 3 | 4 | 5);
    setFormValues((prev) => {
      const next = [...prev.images];
      if (count < next.length) {
        for (let i = count; i < 5; i++) next[i] = null;
      }
      return { ...prev, images: next };
    });
  };

  const handleSingleFileChange = (index: number, file: File | null) => {
    setFormValues((prev) => {
      const newArr = [...prev.images];
      newArr[index] = file;
      return { ...prev, images: newArr };
    });
  };

  const addCurrentColor = useCallback(() => {
    if (formValues.colors.length >= 5) {
      setModalError("You can add a maximum of 5 color swatches.");
      if (!toast.isActive("max-colors"))
        toast.warn("Maximum of 5 color swatches allowed.", { toastId: "max-colors", autoClose: 3000 });
      return;
    }
    if (!formValues.colors.includes(currentColor)) {
      setFormValues((prev) => ({
        ...prev,
        colors: [...prev.colors, currentColor],
        colorImages: { ...prev.colorImages, [currentColor]: [] },
      }));
      setModalError("");
      if (!toast.isActive("color-added"))
        toast.success("Color added successfully.", { toastId: "color-added", autoClose: 3000 });
    }
  }, [formValues.colors, currentColor]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setDeletingProductId(deleteTarget._id);
    try {
      const res = await fetch(
        `https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${deleteTarget._id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete the product");
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
      if (!toast.isActive("delete-" + deleteTarget._id))
        toast.success("Product deleted successfully.", {
          toastId: "delete-" + deleteTarget._id,
          autoClose: 3000,
        });
    } catch (error: unknown) {
      if (!toast.isActive("delete-error-" + deleteTarget._id))
        toast.error(getErrorMessage(error, "Error deleting product."), {
          toastId: "delete-error-" + deleteTarget._id,
          autoClose: 3000,
        });
    } finally {
      setDeletingProductId(null);
    }
  }, [deleteTarget]);

  const handleToggle = useCallback(async (product: Product) => {
    try {
      const updatedProduct = { ...product, published: !product.published };
      const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${product._id}/published`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: updatedProduct.published }),
      });
      if (!res.ok) throw new Error("Failed to update the product status");
      setProducts((prev) =>
        prev.map((p) => (p._id === product._id ? updatedProduct : p))
      );
      if (!toast.isActive("toggle-" + product._id))
        toast.success(
          `Product ${updatedProduct.published ? "published" : "unpublished"} successfully.`,
          { toastId: "toggle-" + product._id, autoClose: 3000 }
        );
    } catch (error: unknown) {
      if (!toast.isActive("toggle-error-" + product._id))
        toast.error(getErrorMessage(error, "Error updating product status."), { toastId: "toggle-error-" + product._id, autoClose: 3000 });
    }
  }, []);
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
  
    /* ---------- 1. collect real files ---------- */
    const validGlobals = formValues.images.filter(Boolean) as File[];   // <-- key line
  
    /* ---------- 2. basic validation ---------- */
    if (!formValues.name || !formValues.desc || !formValues.price) {
      toast.error("Name, description & price are required");
      return;
    }
    if (validGlobals.length === 0) {                                    // <-- test real files
      toast.error("Please upload at least one image");
      return;
    }
  
    setModalLoading(true);
    try {
      /* helper */
      const toBase64 = (file: File) =>
        new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(",")[1]);      // strip data-URL prefix
          r.onerror = rej;
          r.readAsDataURL(file);
        });
  
      /* ---------- 3. upload global images ---------- */
      const uploadedGlobal: { url: string; publicId: string }[] = [];
      for (const file of validGlobals) {
        const b64 = await toBase64(file);
        const up = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: b64, folder: "phulkari_products" }),
        });
        if (!up.ok) throw new Error("Global image upload failed");
        const d = await up.json();
        uploadedGlobal.push({ url: d.secure_url, publicId: d.public_id });
      }
  
      /* ---------- 4. upload colour images ---------- */
      const uploadedByColor: Record<string, { url: string; publicId: string }[]> = {};
      for (const clr of formValues.colors) {
        const files = (formValues.colorImages[clr] || []) as File[];
        uploadedByColor[clr] = [];
        for (const f of files) {
          const b64 = await toBase64(f);
          const up = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/images/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: b64, folder: "phulkari_products" }),
          });
          if (!up.ok) throw new Error(`Colour ${clr} image upload failed`);
          const d = await up.json();
          uploadedByColor[clr].push({ url: d.secure_url, publicId: d.public_id });
        }
      }
  
      /* ---------- 5. build payload ---------- */
      const payload = {
        name:  formValues.name,
        desc:  formValues.desc,
        price: formValues.price,
        globalImages: uploadedGlobal,
        defaultImage: uploadedGlobal[0] || null,
        imagesByColor: uploadedByColor,
        colors:  formValues.colors,
        sizes:   formValues.sizes,
        badge:   formValues.badge,
        published: formValues.published,
        ...(formValues.categoryId && { category: formValues.categoryId }),
      };
  
      /* ---------- 6. save product ---------- */
      const res = await fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Product creation failed");
  
      const newProduct = (await res.json()) as Product;
      setProducts((prev) => [newProduct, ...prev]);
      closeModal();
      toast.success("Product created");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Error creating product"));
    } finally {
      setModalLoading(false);
    }
  }, [formValues, closeModal]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFieldChange("name", e.target.value);
    },
    [handleFieldChange]
  );
  const handleDescChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleFieldChange("desc", e.target.value);
    },
    [handleFieldChange]
  );
  const handlePriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFieldChange("price", e.target.value);
    },
    [handleFieldChange]
  );

  const handleColorImageChange = (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const existing = formValues.colorImages[color] || [];
      if (existing.length + files.length > 3) {
        setModalError("You can only upload up to 3 images per color swatch.");
        if (!toast.isActive("color-max-" + color)) {
          toast.error("Max of 3 images allowed per color.", { toastId: "color-max-" + color, autoClose: 3000 });
        }
        return;
      }
      setModalError("");
      setFormValues((prev) => ({
        ...prev,
        colorImages: {
          ...prev.colorImages,
          [color]: [...existing, ...files],
        },
      }));
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroLead}>
          <span className={styles.heroEyebrow}>Catalog</span>
          <h1 className={styles.heroTitle}>Catalog command center.</h1>
          <p className={styles.heroText}>{heroSummary}</p>
          <div className={styles.heroActions}>
            <button
              type="button"
              onClick={openModal}
              className="rr-admin-button rr-admin-button--primary"
            >
              <Plus size={16} />
              New Product
            </button>
            <Link
              href="/admin/analytics"
              className="rr-admin-button rr-admin-button--secondary"
            >
              Open Analytics
            </Link>
            <Link
              href="/"
              className="rr-admin-button rr-admin-button--ghost"
            >
              View Store
            </Link>
          </div>
          <div className={styles.heroSignalRail}>
            {heroSignals.map((signal) => (
              <article key={signal.label} className={styles.heroSignal}>
                <span className={styles.heroSignalLabel}>{signal.label}</span>
                <strong className={styles.heroSignalValue}>{signal.value}</strong>
                <p className={styles.heroSignalText}>{signal.detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.heroStats}>
          <article className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Products</span>
            <strong className={styles.heroStatValue}>{products.length}</strong>
            <p className={styles.heroStatText}>
              {publishedCount} live · {draftCount} draft
            </p>
          </article>
          <article className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Catalog Value</span>
            <strong className={styles.heroStatValue}>
              ₹{catalogValue.toLocaleString("en-IN")}
            </strong>
            <p className={styles.heroStatText}>
              Avg ₹{averagePrice.toLocaleString("en-IN")}
            </p>
          </article>
          <article className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Media Coverage</span>
            <strong className={styles.heroStatValue}>{imageCoverage}%</strong>
            <p className={styles.heroStatText}>{withImageCount} with hero media</p>
          </article>
          <article className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Ready to Merchandise</span>
            <strong className={styles.heroStatValue}>{withVariantsCount}</strong>
            <p className={styles.heroStatText}>Products with sizes or colors</p>
          </article>
        </div>
      </section>

      {issues.length > 0 ? (
        <section className={styles.issueBanner}>
          <strong>Snapshot notes</strong>
          <ul className={styles.issueList}>
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.insightGrid}>
        <article className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <h2 className={styles.insightTitle}>Readiness</h2>
            <span className="rr-admin-badge rr-admin-badge--info">Live</span>
          </div>
          <p className={styles.insightText}>Core publish coverage.</p>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span>Categories linked</span>
              <strong>{categoryCoverage}%</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Tagged products</span>
              <strong>{tagCoverage}%</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Just-in highlights</span>
              <strong>{justInCount}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Available categories</span>
              <strong>{categoryCount}</strong>
            </div>
            <div className={styles.detailRow}>
              <span>Available tags</span>
              <strong>{tagCount}</strong>
            </div>
          </div>
        </article>

        <article className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <h2 className={styles.insightTitle}>Spotlight</h2>
            <span className="rr-admin-badge rr-admin-badge--success">Value</span>
          </div>
          <p className={styles.insightText}>Highest-value current items.</p>
          <ul className={styles.insightList}>
            {spotlightProducts.map((product) => (
              <li key={product._id} className={styles.insightListItem}>
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.badge || "No badge"}</p>
                </div>
                <span>₹{parsePrice(product.price).toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <h2 className={styles.insightTitle}>Needs attention</h2>
            <span className="rr-admin-badge rr-admin-badge--warning">Action</span>
          </div>
          <p className={styles.insightText}>Drafts and incomplete listings.</p>
          <ul className={styles.insightList}>
            {attentionProducts.length > 0 ? (
              attentionProducts.map((product) => (
                <li key={product._id} className={styles.insightListItem}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {!product.published
                        ? "Draft"
                        : !product.defaultImage?.url
                          ? "Missing hero image"
                          : !product.category
                            ? "Category missing"
                            : "Description needs work"}
                    </p>
                  </div>
                  <Link href={`/admin/products/${product._id}/edit`}>Open</Link>
                </li>
              ))
            ) : (
              <li className={styles.insightListItem}>
                <div>
                  <strong>No urgent product gaps</strong>
                  <p>The current snapshot looks structurally healthy.</p>
                </div>
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className={styles.catalogPanel}>
        <div className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <button onClick={openModal} className={styles.addButton}>
            <Plus size={16} /> New Product
          </button>
        </div>
        {paginatedProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>
              {searchTerm ? "No products match the current search." : "No products yet."}
            </strong>
            <p>
              {searchTerm
                ? "Adjust the search term or clear it to see the full catalog."
                : "Create the first product to start shaping the catalog."}
            </p>
          </div>
        ) : (
          <ul className={styles.productList}>
            {paginatedProducts.map((product) => (
              <li key={product._id} className={styles.productItem}>
                <div className={styles.productRow}>
                  <div className={styles.productImageContainer}>
                    <Image
                      src={product.defaultImage?.url || "/images/phulkari_bag.webp"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.productDetails}>
                    <div className={styles.productSummary}>
                      <div>
                        <h2 className={styles.productName}>{product.name}</h2>
                        <p className={styles.productDesc}>
                          {product.desc || "Description pending for this product."}
                        </p>
                      </div>
                      <div className={styles.productMetrics}>
                        <p className={styles.productPrice}>
                          ₹{parsePrice(product.price).toLocaleString("en-IN")}
                        </p>
                        <p className={styles.productAssist}>
                          {(product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0
                            ? `${product.colors?.length ?? 0} colors · ${
                                product.sizes?.length ?? 0
                              } sizes`
                            : "Variant setup pending"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.productMeta}>
                      <span
                        className={`rr-admin-badge ${
                          product.published
                            ? "rr-admin-badge--success"
                            : "rr-admin-badge--warning"
                        }`}
                      >
                        {product.published ? "Published" : "Draft"}
                      </span>
                      <span className="rr-admin-badge rr-admin-badge--info">
                        {product.defaultImage?.url ? "Hero ready" : "Hero pending"}
                      </span>
                      <span
                        className={`rr-admin-badge ${
                          product.category
                            ? "rr-admin-badge--info"
                            : "rr-admin-badge--warning"
                        }`}
                      >
                        {product.category ? "Category linked" : "Category pending"}
                      </span>
                      <span className="rr-admin-badge rr-admin-badge--info">
                        {product.tags?.length ? `${product.tags.length} tags` : "No tags"}
                      </span>
                    </div>
                    {product.sizes && product.sizes.length > 0 && (
                      <div className={styles.sizesContainer}>
                        {product.sizes.map((size, idx) => (
                          <span key={idx} className={styles.sizeChip}>
                            {size}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.actionButtons}>
                    <Link
                      href={`/products/${product._id}`}
                      title="Preview storefront"
                      className={styles.iconButton}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      title="Edit"
                      className={styles.iconButton}
                    >
                      <PencilLine size={16} />
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className={styles.iconButton}
                      title="Delete"
                      disabled={deletingProductId === product._id}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggle(product)}
                      className={styles.toggleButton}
                      title={product.published ? "Unpublish" : "Publish"}
                    >
                      {product.published ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.pagination}>
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className={styles.pageButton}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {Math.max(totalPages, 1)}
          </span>
          <button
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={styles.pageButton}
          >
            Next
          </button>
        </div>
      </section>
      {modalOpen && (
        <ModalComp onClose={closeModal}>
          <h2>New product</h2>
          {modalError && <p className={styles.modalError}>{modalError}</p>}
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <label className={styles.modalLabel}>Product name</label>
            <input
              type="text"
              value={formValues.name}
              onChange={handleNameChange}
              className={styles.modalInput}
              required
            />
            <label className={styles.modalLabel}>Description</label>
            <textarea
              value={formValues.desc}
              onChange={handleDescChange}
              className={styles.modalTextarea}
              required
            />
            <label className={styles.modalLabel}>Price (INR)</label>
            <input
              type="text"
              value={formValues.price}
              onChange={handlePriceChange}
              className={styles.modalInput}
              required
            />

            <label className={styles.modalLabel}>Category</label>
            <div className={styles.categoryDropdown} ref={containerRef}>
              <input
                type="text"
                placeholder="Search categories"
                value={categorySearch}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(event) => {
                  setCategorySearch(event.target.value);
                  setFormValues((prev) => ({ ...prev, categoryId: "" }));
                  setIsDropdownOpen(true);
                }}
                className={styles.modalInput}
              />
              {formValues.categoryId ? (
                <p className="rr-admin-mutedText">Selected: {categorySearch}</p>
              ) : null}
              {isDropdownOpen ? (
                <ul className={`${styles.dropdownList} ${styles.open}`}>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <li
                        key={category._id}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setFormValues((prev) => ({ ...prev, categoryId: category._id }));
                          setCategorySearch(category.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {category.name}
                      </li>
                    ))
                  ) : (
                    <li className={styles.dropdownItemDisabled}>No categories found</li>
                  )}
                </ul>
              ) : null}
            </div>

            <label className={styles.modalLabel}>Image slots</label>
            <select
              value={imageCount}
              onChange={(e) => handleImageCountChange(Number(e.target.value))}
              className={styles.modalInput}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            <label className={styles.modalLabel}>Primary images</label>
            <div className={styles.dynamicImagesWrapper}>
              {Array.from({ length: imageCount }).map((_, idx) => (
                <input
                  key={idx}
                  type="file"
                  onChange={(event) =>
                    handleSingleFileChange(
                      idx,
                      event.target.files ? event.target.files[0] : null
                    )
                  }
                  className={styles.modalInput}
                />
              ))}
            </div>


            <label className={styles.modalLabel}>Extra gallery images</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className={styles.modalInput}
            />
            <div className={styles.swatchToggleWrapper}>
              <label className={styles.swatchToggleLabel}>
                <input
                  type="checkbox"
                  checked={swatchesEnabled}
                  onChange={(e) => setSwatchesEnabled(e.target.checked)}
                />{" "}
                Enable color swatches
              </label>
            </div>
            {swatchesEnabled && (
              <>
                <label className={styles.modalLabel}>Colors</label>
                <ColorPickerComp
                  currentColor={currentColor}
                  onCurrentColorChange={setCurrentColor}
                  onAddColor={addCurrentColor}
                />
                {formValues.colors.length > 0 && (
                  <RenderColorSwatchesComp
                    colors={formValues.colors}
                    activeSwatch={activeSwatch}
                    onSwatchClick={(color) =>
                      setActiveSwatch((prev) => (prev === color ? null : color))
                    }
                    onColorImageChange={handleColorImageChange}
                  />
                )}
              </>
            )}
            <label className={styles.modalLabel}>Sizes</label>
            <SizeChipsComp
              selectedSizes={formValues.sizes}
              onToggleSize={(size) => {
                if (formValues.sizes.includes(size)) {
                  handleFieldChange(
                    "sizes",
                    formValues.sizes.filter((s) => s !== size)
                  );
                } else {
                  handleFieldChange("sizes", [...formValues.sizes, size]);
                }
              }}
            />
            <label className={styles.modalLabel}>Badge</label>
            <input
              type="text"
              value={formValues.badge}
              onChange={(e) => handleFieldChange("badge", e.target.value)}
              className={styles.modalInput}
            />
            <label className={styles.modalLabel}>
              Published{" "}
              <input
                type="checkbox"
                checked={formValues.published}
                onChange={(e) => handleFieldChange("published", e.target.checked)}
              />
            </label>
            <div className={styles.modalButtonRow}>
              <button
                type="submit"
                disabled={modalLoading}
                className={styles.submitButton}
                style={{ opacity: modalLoading ? 0.7 : 1 }}
              >
                {modalLoading ? (
                  <>
                    <span className={styles.spinnerSmall}></span> Saving...
                  </>
                ) : (
                  "Save product"
                )}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </ModalComp>
      )}
      {deleteTarget ? (
        <div className="rr-admin-modalBackdrop">
          <div className="rr-admin-modal">
            <div className="rr-admin-modalHeader">
              <div>
                <h2 className="rr-admin-modalTitle">Delete product</h2>
                <p className="rr-admin-panelText">
                  Remove <strong>{deleteTarget.name}</strong> from the catalog. This also removes
                  its current publish state, merchandising surface, and quick access from the admin
                  desk.
                </p>
              </div>
              <button
                type="button"
                className="rr-admin-iconButton"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingProductId === deleteTarget._id}
              >
                <X size={16} />
              </button>
            </div>

            <div className="rr-admin-modalActions">
              <button
                type="button"
                className="rr-admin-button rr-admin-button--ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingProductId === deleteTarget._id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rr-admin-button rr-admin-button--danger"
                onClick={() => void handleDelete()}
                disabled={deletingProductId === deleteTarget._id}
              >
                {deletingProductId === deleteTarget._id ? "Deleting..." : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isOffline && <OfflineModalComp onRetry={() => window.location.reload()} />}
    </div>
  );
}

const ModalComp = memo(function ModalComp({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close product form"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
});

const OfflineModalComp = memo(function OfflineModalComp({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className={styles.offlineModalOverlay}>
      <div className={styles.offlineModal}>
        <WifiOff size={22} />
        <h2>Offline</h2>
        <p>Reconnect to keep product changes and publish actions available.</p>
        <button type="button" className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      </div>
    </div>
  );
});

const ColorPickerComp = memo(function ColorPickerComp({
  currentColor,
  onCurrentColorChange,
  onAddColor,
}: {
  currentColor: string;
  onCurrentColorChange: (val: string) => void;
  onAddColor: () => void;
}) {
  return (
    <div className={styles.colorPickerSection}>
      <input
        type="color"
        value={currentColor}
        onChange={(e) => onCurrentColorChange(e.target.value)}
        className={styles.colorPicker}
      />
      <button type="button" onClick={onAddColor} className={styles.addColorButton}>
        <Plus size={14} /> Add color
      </button>
    </div>
  );
});

const RenderColorSwatchesComp = memo(function RenderColorSwatchesComp({
  colors,
  activeSwatch,
  onSwatchClick,
  onColorImageChange,
}: {
  colors: string[];
  activeSwatch: string | null;
  onSwatchClick: (color: string) => void;
  onColorImageChange: (color: string, e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={styles.selectedColorsContainer}>
      {colors.map((color) => (
        <div key={color} className={styles.selectedColor}>
          <div
            className={styles.colorSwatch}
            style={{ backgroundColor: color }}
            title="Selected color"
            onClick={() => onSwatchClick(color)}
          />
          <label className={styles.swatchLabel}>{color}</label>
          {activeSwatch === color && (
            <div className={styles.swatchUploads}>
              {[0, 1, 2].map((slot) => (
                <div key={slot} className={styles.swatchUpload}>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        onColorImageChange(color, e);
                    }}
                    className={styles.swatchFileInput}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

const SizeChipsComp = memo(function SizeChipsComp({
  selectedSizes,
  onToggleSize,
}: {
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
}) {
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  return (
    <div className={styles.sizeChipsContainer}>
      {availableSizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onToggleSize(size)}
          className={`${styles.sizeChip} ${selectedSizes.includes(size) ? styles.sizeChipSelected : ""}`}
        >
          {size}
        </button>
      ))}
    </div>
  );
});
