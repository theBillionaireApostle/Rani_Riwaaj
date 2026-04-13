"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Tags, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/error-utils";

interface Tag {
  _id: string;
  name: string;
  slug: string;
}

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://rani-riwaaj-backend-ylbq.vercel.app";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingTags, setLoadingTags] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Tag>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const perPage = 10;

  const fetchTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const response = await fetch(`${BACKEND_BASE}/api/tags`);
      if (!response.ok) throw new Error("Failed to load tags.");
      const data: Tag[] = await response.json();
      setTags(data);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Unable to load tags."));
    } finally {
      setLoadingTags(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const filteredTags = useMemo(
    () =>
      tags.filter((tag) =>
        [tag.name, tag.slug]
          .join(" ")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      ),
    [tags, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / perPage));
  const visibleTags = useMemo(
    () => filteredTags.slice((page - 1) * perPage, page * perPage),
    [filteredTags, page]
  );

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

  const closeModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setCurrent({});
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = current.name?.trim();
    const slug = current.slug?.trim();

    if (!name || !slug) {
      setError("Both name and slug are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        isEditing ? `${BACKEND_BASE}/api/tags/${current._id}` : `${BACKEND_BASE}/api/tags`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast.success(`Tag ${isEditing ? "updated" : "created"} successfully.`);
      closeModal();
      fetchTags();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Unable to save tag.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag?")) return;

    try {
      const response = await fetch(`${BACKEND_BASE}/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed.");
      }

      toast.success("Tag deleted.");
      fetchTags();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Delete failed."));
    }
  };

  return (
    <section className="rr-admin-page">
      <div className="rr-admin-pageIntro">
        <div className="rr-admin-pageLead">
          <span className="rr-admin-kicker">Structure</span>
          <h1 className="rr-admin-pageTitle">Tags</h1>
          <p className="rr-admin-pageDescription">
            Keep tag taxonomy clean and usable.
          </p>
        </div>
        <div className="rr-admin-actions">
          <button
            type="button"
            className="rr-admin-button rr-admin-button--primary"
            onClick={openAdd}
          >
            <Plus size={16} />
            New tag
          </button>
        </div>
      </div>

      <div className="rr-admin-statGrid">
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Tags</span>
          <strong className="rr-admin-statValue">{tags.length}</strong>
          <span className="rr-admin-statMeta">Current tag records in the system.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Visible now</span>
          <strong className="rr-admin-statValue">{filteredTags.length}</strong>
          <span className="rr-admin-statMeta">Matching the active search filter.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Page size</span>
          <strong className="rr-admin-statValue">{perPage}</strong>
          <span className="rr-admin-statMeta">Tags shown per page in this view.</span>
        </article>
        <article className="rr-admin-statCard">
          <span className="rr-admin-statLabel">Pages</span>
          <strong className="rr-admin-statValue">{totalPages}</strong>
          <span className="rr-admin-statMeta">Current pagination depth.</span>
        </article>
      </div>

      <div className="rr-admin-panel">
        <div className="rr-admin-toolbar">
          <label className="rr-admin-search">
            <span className="rr-admin-searchLabel">Search tags</span>
            <div className="rr-admin-inlineSearch">
              <Search size={18} />
              <input
                className="rr-admin-input"
                type="text"
                placeholder="Search by name or slug"
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
            Add tag
          </button>
        </div>

        {loadingTags ? (
          <div className="rr-admin-emptyState">
            <strong>Loading tags</strong>
            <p>Fetching the latest taxonomy structure.</p>
          </div>
        ) : visibleTags.length === 0 ? (
          <div className="rr-admin-emptyState">
            <Tags size={28} />
            <strong>{search ? "No tags match the current search." : "No tags yet."}</strong>
            <p>
              {search
                ? "Adjust the search term to explore the full tag list."
                : "Create the first tag to start organizing featured product groups."}
            </p>
          </div>
        ) : (
          <ul className="rr-admin-list">
            {visibleTags.map((tag) => (
              <li key={tag._id} className="rr-admin-listItem">
                <div className="rr-admin-listHeader">
                  <div>
                    <h2 className="rr-admin-listTitle">{tag.name}</h2>
                    <p className="rr-admin-listSubtitle">/{tag.slug}</p>
                  </div>
                  <span className="rr-admin-badge rr-admin-badge--info">Tag</span>
                </div>

                <div className="rr-admin-listMeta">
                  <span className="rr-admin-mutedText">
                    Use this tag for product grouping, storefront filters, and analytics
                    context.
                  </span>
                </div>

                <div className="rr-admin-listActions">
                  <button
                    type="button"
                    className="rr-admin-button rr-admin-button--secondary"
                    onClick={() => openEdit(tag)}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rr-admin-button rr-admin-button--danger"
                    onClick={() => handleDelete(tag._id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="rr-admin-toolbar">
          <span className="rr-admin-mutedText">
            Page {page} of {totalPages}
          </span>
          <div className="rr-admin-actions">
            <button
              type="button"
              className="rr-admin-button rr-admin-button--secondary"
              disabled={page <= 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="rr-admin-button rr-admin-button--secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div className="rr-admin-modalBackdrop">
          <div className="rr-admin-modal">
            <div className="rr-admin-modalHeader">
              <h2 className="rr-admin-modalTitle">
                {isEditing ? "Edit tag" : "Create tag"}
              </h2>
              <button
                type="button"
                className="rr-admin-iconButton"
                onClick={closeModal}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="rr-admin-grid">
              {error ? <p className="rr-admin-fieldError">{error}</p> : null}

              <label className="rr-admin-field">
                <span className="rr-admin-fieldLabel">Name</span>
                <input
                  className="rr-admin-input"
                  type="text"
                  value={current.name || ""}
                  onChange={(event) =>
                    setCurrent((tag) => {
                      const name = event.target.value;
                      const previousSlug = tag.slug || "";
                      const shouldSyncSlug =
                        !isEditing || !previousSlug || previousSlug === slugify(tag.name || "");

                      return {
                        ...tag,
                        name,
                        slug: shouldSyncSlug ? slugify(name) : previousSlug,
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
                  value={current.slug || ""}
                  onChange={(event) =>
                    setCurrent((tag) => ({ ...tag, slug: slugify(event.target.value) }))
                  }
                  required
                />
              </label>

              <div className="rr-admin-modalActions">
                <button
                  type="button"
                  className="rr-admin-button rr-admin-button--ghost"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rr-admin-button rr-admin-button--primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : isEditing ? "Save changes" : "Create tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
