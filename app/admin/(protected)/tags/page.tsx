

// app/admin/(protected)/tags/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Tag {
  _id: string;
  name: string;
  slug: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Tag>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const baseURL =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://rani-riwaaj-backend-ylbq.vercel.app";

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`${baseURL}/api/tags`);
      if (!res.ok) throw new Error("Failed to load tags");
      const data = await res.json();
      setTags(data);
    } catch (err: any) {
      toast.error(err.message || "Error loading tags");
    }
  }, [baseURL]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Filter & paginate
  const filtered = useMemo(
    () =>
      tags.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [tags, search]
  );
  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = useMemo(
    () =>
      filtered.slice((page - 1) * perPage, (page - 1) * perPage + perPage),
    [filtered, page]
  );

  // Modal controls
  const openAdd = () => {
    setIsEditing(false);
    setCurrent({});
    setError("");
    setModalOpen(true);
  };
  const openEdit = (tag: Tag) => {
    setIsEditing(true);
    setCurrent(tag);
    setError("");
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  // Create or update tag
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current.name || !current.slug) {
      setError("Both name and slug are required.");
      return;
    }
    setLoading(true);
    try {
      const url = isEditing
        ? `${baseURL}/api/tags/${current._id}`
        : `${baseURL}/api/tags`;
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: current.name,
          slug: current.slug,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Tag ${isEditing ? "updated" : "created"}!`);
      closeModal();
      fetchTags();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
      toast.error(err.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Delete tag
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      const res = await fetch(`${baseURL}/api/tags/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Tag deleted");
      fetchTags();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="container">
      <h1>Manage Tags</h1>

      <div className="controls">
        <div className="search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="btn add" onClick={openAdd}>
          <Plus size={16} /> Add Tag
        </button>
      </div>

      <ul className="list">
        {paged.map((t) => (
          <li key={t._id}>
            <span className="tag-name">{t.name}</span>
            <span className="tag-slug">/{t.slug}</span>
            <div className="actions">
              <button onClick={() => openEdit(t)}><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(t._id)}><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{isEditing ? "Edit Tag" : "New Tag"}</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <label>Name</label>
              <input
                type="text"
                value={current.name || ""}
                onChange={(e) => setCurrent((c) => ({ ...c, name: e.target.value }))}
                required
              />
              <label>Slug</label>
              <input
                type="text"
                value={current.slug || ""}
                onChange={(e) => setCurrent((c) => ({ ...c, slug: e.target.value }))}
                required
              />
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn cancel">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn save">
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: auto;
          padding: 2rem;
          font-family: Poppins, sans-serif;
          color: #333;
        }
        h1 {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1.75rem;
          font-weight: 600;
        }
        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #fff;
          transition: border-color 0.2s ease;
        }
        .search input {
          border: none;
          outline: none;
          font-size: 1rem;
          flex: 1;
        }
        .search:hover,
        .search:focus-within {
          border-color: #0070f3;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .btn.add {
          background: #0070f3;
          color: #fff;
        }
        .btn.add:hover {
          background: #005bb5;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .list {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid #eee;
        }
        .list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #eee;
          transition: background 0.2s ease;
        }
        .list li:hover {
          background: #fafafa;
        }
        .tag-name {
          font-weight: 500;
          font-size: 1rem;
        }
        .tag-slug {
          color: #666;
          margin-left: 0.5rem;
          font-size: 0.9rem;
        }
        .actions button {
          background: none;
          border: none;
          cursor: pointer;
          color: #555;
          margin-left: 0.5rem;
          transition: color 0.2s ease;
        }
        .actions button:hover {
          color: #000;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .pagination button {
          padding: 0.5rem 1rem;
          border: 1px solid #ccc;
          background: #fff;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s ease, transform 0.1s ease;
        }
        .pagination button:hover:not(:disabled) {
          background: #f0f0f0;
          transform: translateY(-1px);
        }
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: #fff;
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          position: relative;
        }
        .modal h2 {
          margin-top: 0;
          margin-bottom: 1.25rem;
          font-size: 1.5rem;
          font-weight: 600;
          color: #222;
        }
        .error {
          color: #e63946;
          font-size: 0.9rem;
        }
        .modal form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .modal form label {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }
        .modal form input {
          padding: 0.65rem 0.75rem;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .modal form input:focus {
          border-color: #0070f3;
          box-shadow: 0 0 0 3px rgba(0,112,243,0.15);
          outline: none;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        .btn.cancel {
          background: #eee;
          color: #333;
        }
        .btn.cancel:hover {
          background: #ddd;
        }
        .btn.save {
          background: #0070f3;
          color: #fff;
        }
        .btn.save:hover:not(:disabled) {
          background: #005bb5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}
