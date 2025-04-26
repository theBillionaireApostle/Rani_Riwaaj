/* app/admin/(protected)/categories/CategoriesClient.tsx */
"use client"

import React, {
  useState,
  useMemo,
  useCallback,
  ChangeEvent,
  FormEvent,
} from "react"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faTrashAlt,
  faEdit,
  faPlus,
  faSearch,
  faTimes,
} from "@fortawesome/free-solid-svg-icons"
import { toast } from "react-toastify"
import styles from "./CategoriesClient.module.css"

/* ---------- types ---------- */

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: { url: string; publicId: string }
}

interface Props {
  initialCategories: Category[]
}

/* ---------- helpers ---------- */

/** read token safely (works during SSR hydration) */
const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("admin_jwt") ?? "" : ""

/** merges JSON + auth headers */
const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

/* ---------- component ---------- */

export default function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const perPage = 5

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [curr, setCurr] = useState<Partial<Category>>({})
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /* ---- derived ---- */
  const filtered = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [categories, search]
  )
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  /* ---- helpers ---- */
  const resetModal = () => {
    setModalOpen(false)
    setIsEditing(false)
    setCurr({})
    setFile(null)
    setPreviewUrl(null)
    setError("")
  }

  const openAdd = () => {
    resetModal()
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setIsEditing(true)
    setCurr(cat)
    setPreviewUrl(cat.image?.url ?? null)
    setModalOpen(true)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreviewUrl(f ? URL.createObjectURL(f) : null)
  }

  const fileToBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1] || "")
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(f)
    })

  /* ---- create / update ---- */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!curr.name || !curr.slug) {
        setError("Name and slug are required.")
        return
      }

      setLoading(true)
      setError("")

      try {
        let imageBase64: string | undefined
        if (file) imageBase64 = await fileToBase64(file)

        const payload: Record<string, unknown> = {
          name: curr.name,
          slug: curr.slug,
          description: curr.description,
          ...(imageBase64 ? { imageBase64 } : {}),
        }

        const url = isEditing
          ? `http://localhost:5005/api/categories/${curr._id}`
          : "http://localhost:5005/api/categories"
        const method = isEditing ? "PATCH" : "POST"

        const res = await fetch(url, {
          method,
          headers: authHeaders(),
          body: JSON.stringify(payload),
        })

        if (!res.ok) throw new Error(await res.text())
        const updated: Category = await res.json()

        setCategories((prev) =>
          isEditing
            ? prev.map((c) => (c._id === updated._id ? updated : c))
            : [updated, ...prev]
        )
        toast.success(`Category ${isEditing ? "updated" : "created"} successfully!`)
        resetModal()
      } catch (err: any) {
        setError(err.message || "Operation failed.")
        toast.error(err.message || "Operation failed.")
      } finally {
        setLoading(false)
      }
    },
    [curr, file, isEditing]
  )

  /* ---- delete ---- */
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      const res = await fetch(`http://localhost:5005/api/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(await res.text())
      setCategories((p) => p.filter((c) => c._id !== id))
      toast.success("Category deleted")
    } catch (err: any) {
      toast.error(err.message || "Delete failed")
    }
  }, [])

  /* ---- render ---- */
  return (
    <div className={styles.container}>
      {/* top bar */}
      <div className={styles.header}>
        <div className={styles.search}>
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <button className={styles.addButton} onClick={openAdd}>
          <FontAwesomeIcon icon={faPlus} /> Add Category
        </button>
      </div>

      {/* list */}
      <ul className={styles.list}>
        {paged.map((cat) => (
          <li key={cat._id} className={styles.item}>
            <div className={styles.image}>
              <Image
                src={cat.image?.url ?? "/cat-placeholder.png"}
                alt={cat.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className={styles.details}>
              <h3>{cat.name}</h3>
              <p>{cat.description}</p>
            </div>
            <div className={styles.actions}>
              <button className={styles.iconBtn} onClick={() => openEdit(cat)}>
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button className={styles.iconBtn} onClick={() => handleDelete(cat._id)}>
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* pagination */}
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {/* modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <header className={styles.modalHeader}>
              <h2>{isEditing ? "Edit" : "Add"} Category</h2>
              <button className={styles.closeBtn} onClick={resetModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              {error && <p className={styles.modalError}>{error}</p>}

              <label>Name*</label>
              <input
                type="text"
                value={curr.name || ""}
                onChange={(e) => setCurr((p) => ({ ...p, name: e.target.value }))}
                required
              />

              <label>Slug*</label>
              <input
                type="text"
                value={curr.slug || ""}
                onChange={(e) => setCurr((p) => ({ ...p, slug: e.target.value }))}
                required
              />

              <label>Description</label>
              <textarea
                value={curr.description || ""}
                onChange={(e) =>
                  setCurr((p) => ({ ...p, description: e.target.value }))
                }
              />

              <label>Image {isEditing ? "(leave blank to keep)" : "*"}</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />

              {previewUrl && (
                <div className={styles.preview}>
                  <Image src={previewUrl} alt="Preview" fill style={{ objectFit: "cover" }} />
                </div>
              )}

              <div className={styles.modalButtonRow}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? "Saving…" : "Save"}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={resetModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}