/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports */
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faToggleOn,
  faToggleOff,
  faPlus,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import styles from "./Dashboard.module.css";

// Product type definition.
export interface Product {
  _id: string;
  name: string;
  desc: string;
  price: string;
  published?: boolean;
  defaultImage?: { url: string; publicId: string };
  colors?: string[];
  sizes?: string[];
  badge?: string;
}

interface DashboardProps {
  products: Product[];
}

interface PreviewData {
  globalPreviews: string[];
  colorPreviews: { [color: string]: string[] };
  // Add other properties as needed.
}

export default function Dashboard({ products: initialProducts }: DashboardProps) {
  // Global states.
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSelectedColor, setPreviewSelectedColor] = useState<string | null>(null);

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
    } catch (err) {
      toast.error("Could not load categories.");
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
    setPreviewData(null);
    setPreviewModalOpen(false);
    setPreviewSelectedColor(null);
    setActiveSwatch(null);
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * NEW: Handle multi‑select file upload (fallback for legacy input)
   */
  // handleFileChange
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files) return;

  const newFiles = Array.from(e.target.files).slice(0, 5);
  if (newFiles.length === 0) return;

  /* ---------- set imageCount safely ---------- */
  setImageCount(prev => {
    const next = Math.min(5, Math.max(prev, newFiles.length)) as 1 | 2 | 3 | 4 | 5;
    return next;
  });

  /* ---------- merge the files into formValues.images ---------- */
  setFormValues(prev => {
    const nextSlots = [...prev.images];     // preserve existing
    let ptr = 0;
    for (const file of newFiles) {
      while (ptr < 5 && nextSlots[ptr]) ptr++;  // skip filled slots
      if (ptr < 5) nextSlots[ptr] = file;
    }
    return { ...prev, images: nextSlots };
  });
};

  const handleImageCountChange = (count: number) => {
    setImageCount(count as 1 | 2 | 3 | 4 | 5);
    setFormValues(prev => {
      const next = [...prev.images];
  
      /* Clear extra slots only if count got smaller */
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

  const handleSwatchFileChange = useCallback((color: string, slot: number, file: File) => {
    setFormValues((prev) => {
      const currentFiles = prev.colorImages[color] || [];
      const updatedFiles = [...currentFiles];
      updatedFiles[slot] = file;
      return {
        ...prev,
        colorImages: { ...prev.colorImages, [color]: updatedFiles },
      };
    });
  }, []);

  const generateImagePreviews = useCallback((files: (File | null)[]) => {
    const validFiles = files.filter(Boolean) as File[];
    return Promise.all(
      validFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
  }, []);

  const handlePreview = useCallback(async () => {
    const validGlobals = formValues.images.filter(Boolean) as File[];
    if (!formValues.name || !formValues.desc || !formValues.price) {
      setModalError("Please fill out Product Name, Description, and Price.");
      toast.error("Missing required fields");
      return;
    }
    if (validGlobals.length === 0) {
      setModalError("Please upload at least one image.");
      toast.error("Upload at least one global image");
      return;
    }
    try {
      const globalPreviews = await generateImagePreviews(validGlobals);
      const colorPreviews: { [c: string]: string[] } = {};
      for (const c of formValues.colors) {
        const files = (formValues.colorImages[c] || []) as File[];
        if (files.length) colorPreviews[c] = await generateImagePreviews(files);
      }
      setPreviewSelectedColor(formValues.colors[0] || null);
      setPreviewData({ ...formValues, globalPreviews, colorPreviews });
      setPreviewModalOpen(true);
      setModalError("");
    } catch {
      setModalError("Failed to generate previews");
      toast.error("Preview generation failed");
    }
  }, [formValues]);

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

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete the product");
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      if (!toast.isActive("delete-" + productId))
        toast.success("Product deleted successfully.", { toastId: "delete-" + productId, autoClose: 3000 });
    } catch (error: any) {
      if (!toast.isActive("delete-error-" + productId))
        toast.error(error.message || "Error deleting product.", { toastId: "delete-error-" + productId, autoClose: 3000 });
    }
  }, []);

  const handleToggle = useCallback(async (product: Product) => {
    try {
      const updatedProduct = { ...product, published: !product.published };
      const res = await fetch(`https://rani-riwaaj-backend-ylbq.vercel.app/api/products/${product._id}/toggle`, {
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
    } catch (error: any) {
      if (!toast.isActive("toggle-error-" + product._id))
        toast.error(error.message || "Error updating product status.", { toastId: "toggle-error-" + product._id, autoClose: 3000 });
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
  
      const newProduct = await res.json();      // ✅ await here, outside the setter
setProducts(prev => [newProduct, ...prev]);
      closeModal();
      toast.success("Product created");
    } catch (err: any) {
      toast.error(err.message || "Error creating product");
    } finally {
      setModalLoading(false);
    }
  }, [formValues, closeModal]);

  // --- Memoized Helper Components ---
  const HeaderComp = memo(function HeaderComp() {
    return (
      <header className={styles.header}>
        <div className={styles.logo}>Phulkari Bagh</div>
        <nav className={styles.navLinks}>
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </header>
    );
  });

  const FooterComp = memo(function FooterComp() {
    return (
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} House of Phulkari. All rights reserved.</p>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms & Conditions</Link>
        </div>
      </footer>
    );
  });

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
          <button className={styles.closeButton} onClick={onClose}>
            &times;
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
          <h2>You seem to be offline</h2>
          <p>Please check your internet connection.</p>
          <button className={styles.retryButton} onClick={onRetry}>
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
          <FontAwesomeIcon icon={faPlus} /> Add Color
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
            className={`${styles.sizeChip} ${
              selectedSizes.includes(size) ? styles.sizeChipSelected : ""
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    );
  });

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
    <div className={styles.dashboardContainer}>
      <HeaderComp />
      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
          <button onClick={openModal} className={styles.addButton}>
            <FontAwesomeIcon icon={faPlus} /> Add New Product
          </button>
        </div>
        {paginatedProducts.length === 0 ? (
          <p className={styles.noProducts}>No products found.</p>
        ) : (
          <ul className={styles.productList}>
            {paginatedProducts.map((product) => (
              <li key={product._id} className={styles.productItem}>
                <div className={styles.productRow}>
                  <div className={styles.productImageContainer}>
                    <Image
                      src={product.defaultImage?.url || "/placeholder.png"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className={styles.productDetails}>
                    <h2 className={styles.productName}>{product.name}</h2>
                    <p className={styles.productDesc}>{product.desc}</p>
                    <p className={styles.productPrice}>Price: {product.price}</p>
                    {product.sizes && product.sizes.length > 0 && (
                      <div className={styles.sizesContainer}>
                        {product.sizes.map((size: any, idx: number) => (
                          <span key={idx} className={styles.sizeChip}>
                            {typeof size === "object"
                              ? `${size.label} (${size.badge})`
                              : size}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.actionButtons}>
                    <Link href={`/admin/products/${product._id}/edit`}>
                      <button title="Edit" className={styles.iconButton}>
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className={styles.iconButton}
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                    <button
                      onClick={() => handleToggle(product)}
                      className={styles.toggleButton}
                      title={product.published ? "Unpublish" : "Publish"}
                    >
                      <FontAwesomeIcon icon={product.published ? faToggleOn : faToggleOff} />
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
      </main>
      <FooterComp />
      {modalOpen && (
        <ModalComp onClose={closeModal}>
          <h2>Add New Product</h2>
          {modalError && <p className={styles.modalError}>{modalError}</p>}
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <label className={styles.modalLabel}>Product Name:</label>
            <input
              type="text"
              value={formValues.name}
              onChange={handleNameChange}
              className={styles.modalInput}
              required
            />
            <label className={styles.modalLabel}>Description:</label>
            <textarea
              value={formValues.desc}
              onChange={handleDescChange}
              className={styles.modalTextarea}
              required
            />
            <label className={styles.modalLabel}>Price (INR):</label>
            <input
              type="text"
              value={formValues.price}
              onChange={handlePriceChange}
              className={styles.modalInput}
              required
            />

<label className={styles.modalLabel}>Category (optional):</label>
<div className={styles.categoryDropdown} ref={containerRef}>
  <input
    type="text"
    placeholder="Search categories…"
    value={categorySearch}
    onFocus={() => setIsDropdownOpen(true)}
    onChange={e => {
      setCategorySearch(e.target.value);
      setFormValues(prev => ({ ...prev, categoryId: "" }));
      setIsDropdownOpen(true);
    }}
    className={styles.modalInput}
  />



  {/* DYNAMIC IMAGE COUNT SELECTOR */}
  <label className={styles.modalLabel}>How many images? (max 5)</label>
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


            {/* IMAGE INPUTS RENDERED BASED ON SELECTION */}
            <label className={styles.modalLabel}>Upload Images:</label>
<div className={styles.dynamicImagesWrapper}>
{Array.from({ length: imageCount }).map((_, idx) => (
  <input
    key={idx}
    type="file"
    onChange={e =>
      handleSingleFileChange(
        idx,
        e.target.files ? e.target.files[0] : null
      )
    }
    className={styles.modalInput}
    /* no required */
  />
  ))}
</div>

  {/* only render when open */}
  {isDropdownOpen && filteredCategories.length > 0 && (
  <ul className={`${styles.dropdownList} ${styles.open}`}>
    {filteredCategories.map(c => (
      <li
        key={c._id}
        className={styles.dropdownItem}
        onClick={() => {
          setFormValues(prev => ({ ...prev, categoryId: c._id }));
          setCategorySearch(c.name);
          setIsDropdownOpen(false);
        }}
      >
        {c.name}
      </li>
    ))}
  </ul>
)}
</div>

{/* fallback when search yields nothing */}
{isDropdownOpen && filteredCategories.length === 0 && (
  <ul className={styles.dropdownList}>
    <li className={styles.dropdownItemDisabled}>No categories found</li>
  </ul>
)}


            <label className={styles.modalLabel}>
              Upload Global Images (optional):
            </label>
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
                Enable Color Swatches
              </label>
            </div>
            {swatchesEnabled && (
              <>
                <label className={styles.modalLabel}>Select Colors (max 5):</label>
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
            <label className={styles.modalLabel}>Select Sizes:</label>
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
            <label className={styles.modalLabel}>
              Overall Badge (optional):
            </label>
            <input
              type="text"
              value={formValues.badge}
              onChange={(e) => handleFieldChange("badge", e.target.value)}
              className={styles.modalInput}
            />
            <label className={styles.modalLabel}>
              Published:{" "}
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
                  "Publish"
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
      {isOffline && <OfflineModalComp onRetry={() => window.location.reload()} />}
    </div>
  );
}

//////////////////////////////////////////////
// External Memoized Helper Components
//////////////////////////////////////////////

const HeaderComp = memo(function HeaderComp() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>House of Phulkari</div>
      <nav className={styles.navLinks}>
        <Link href="/">Home</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
});

const FooterComp = memo(function FooterComp() {
  return (
    <footer className={styles.footer}>
      <p>&copy; {new Date().getFullYear()} House of Phulkari. All rights reserved.</p>
      <div className={styles.footerLinks}>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms & Conditions</Link>
      </div>
    </footer>
  );
});

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
        <button className={styles.closeButton} onClick={onClose}>
          &times;
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
        <h2>You seem to be offline</h2>
        <p>Please check your internet connection.</p>
        <button className={styles.retryButton} onClick={onRetry}>
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
        <FontAwesomeIcon icon={faPlus} /> Add Color
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
