"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LayoutGrid, Rows3, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

interface ProductListItem {
  _id: string;
  badge?: string;
  defaultImage?: { url?: string };
  desc?: string;
  name: string;
  price: string | number;
  published?: boolean;
}

interface ProductsCatalogClientProps {
  products: ProductListItem[];
}

type StatusFilter = "all" | "published" | "draft";
type ViewMode = "grid" | "table";

const PAGE_SIZES = [9, 12, 18] as const;

function parsePrice(value: string | number) {
  if (typeof value === "number") return value;
  return Number.parseFloat(String(value).replace(/[^\d.]/g, "")) || 0;
}

function getVisiblePageNumbers(page: number, totalPages: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  const pages = new Set([1, totalPages]);

  for (let current = start; current <= end; current += 1) {
    pages.add(current);
  }

  return Array.from(pages).sort((left, right) => left - right);
}

export function ProductsCatalogClient({
  products,
}: ProductsCatalogClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(12);
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        deferredQuery.length === 0 ||
        product.name.toLowerCase().includes(deferredQuery) ||
        (product.desc ?? "").toLowerCase().includes(deferredQuery) ||
        (product.badge ?? "").toLowerCase().includes(deferredQuery);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? Boolean(product.published) : !product.published);

      return matchesQuery && matchesStatus;
    });
  }, [deferredQuery, products, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);
  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);

  const publishedCount = filteredProducts.filter((product) => product.published).length;
  const draftCount = filteredProducts.length - publishedCount;

  return (
    <div className="rr-admin-panel">
      <div className="rr-admin-panelHeader">
        <div>
          <h2 className="rr-admin-panelTitle">Catalog list</h2>
          <p className="rr-admin-panelText">
            Search, filter, and move through the catalog without rendering the whole set at once.
          </p>
        </div>
      </div>

      <div className="rr-admin-toolbar">
        <div className="rr-admin-search">
          <label htmlFor="admin-products-search" className="rr-admin-searchLabel">
            Search
          </label>
          <div className="rr-admin-inlineSearch rr-admin-inlineSearch--field">
            <Search size={18} />
            <input
              id="admin-products-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, description, or badge"
              className="rr-admin-input"
            />
          </div>
        </div>

        <div className="rr-admin-filterRow">
          <div className="rr-admin-field rr-admin-field--compact">
            <span className="rr-admin-fieldLabel">View</span>
            <div className="rr-admin-segmented" role="tablist" aria-label="Catalog view">
              <button
                type="button"
                role="tab"
                className={
                  viewMode === "grid"
                    ? "rr-admin-segmentedButton is-active"
                    : "rr-admin-segmentedButton"
                }
                aria-selected={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid size={16} />
                Grid
              </button>
              <button
                type="button"
                role="tab"
                className={
                  viewMode === "table"
                    ? "rr-admin-segmentedButton is-active"
                    : "rr-admin-segmentedButton"
                }
                aria-selected={viewMode === "table"}
                onClick={() => setViewMode("table")}
              >
                <Rows3 size={16} />
                Table
              </button>
            </div>
          </div>

          <label className="rr-admin-field rr-admin-field--compact">
            <span className="rr-admin-fieldLabel">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="rr-admin-select"
            >
              <option value="all">All products</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </label>

          <label className="rr-admin-field rr-admin-field--compact">
            <span className="rr-admin-fieldLabel">Density</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number]);
                setPage(1);
              }}
              className="rr-admin-select"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rr-admin-resultsRow">
        <div className="rr-admin-chipGroup">
          <span className="rr-admin-chip">
            Showing {filteredProducts.length.toLocaleString("en-IN")} items
          </span>
          <span className="rr-admin-chip rr-admin-chip--muted">
            {publishedCount.toLocaleString("en-IN")} live
          </span>
          <span className="rr-admin-chip rr-admin-chip--muted">
            {draftCount.toLocaleString("en-IN")} draft
          </span>
        </div>
        <p className="rr-admin-resultsMeta">
          {filteredProducts.length === 0
            ? "No results for the current filters."
            : `Showing ${startIndex + 1}-${Math.min(
                startIndex + pageSize,
                filteredProducts.length
              )} of ${filteredProducts.length}.`}
        </p>
      </div>

      {paginatedProducts.length === 0 ? (
        <div className="rr-admin-emptyState">
          <strong>No products match this view</strong>
          <p>Adjust the search or status filter to widen the catalog slice.</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="rr-admin-cardGrid">
              {paginatedProducts.map((product) => (
                <article key={product._id} className="rr-admin-productCard">
                  <div className="rr-admin-mediaFrame rr-admin-mediaFrame--compact">
                    <Image
                      src={product.defaultImage?.url || "/images/phulkari_bag.webp"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="rr-admin-productBody">
                    <div>
                      <h3 className="rr-admin-listTitle">{product.name}</h3>
                      <p className="rr-admin-listSubtitle">
                        {product.desc || "Description pending."}
                      </p>
                    </div>

                    <div className="rr-admin-listMeta">
                      <span
                        className={`rr-admin-badge ${
                          product.published
                            ? "rr-admin-badge--success"
                            : "rr-admin-badge--warning"
                        }`}
                      >
                        {product.published ? "Published" : "Draft"}
                      </span>
                      {product.badge ? (
                        <span className="rr-admin-badge rr-admin-badge--info">
                          {product.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="rr-admin-productMetaRow">
                      <strong>₹{parsePrice(product.price).toLocaleString("en-IN")}</strong>
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className="rr-admin-button rr-admin-button--secondary"
                      >
                        Edit product
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <table className="rr-admin-dataTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Badge</th>
                  <th>Price</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="rr-admin-dataMedia">
                        <div className="rr-admin-dataThumb">
                          <Image
                            src={product.defaultImage?.url || "/images/phulkari_bag.webp"}
                            alt={product.name}
                            fill
                            sizes="96px"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                        <div className="rr-admin-tableCellStack">
                          <p className="rr-admin-dataTitle">{product.name}</p>
                          <p className="rr-admin-dataSubtitle">
                            {product.desc || "Description pending."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`rr-admin-badge ${
                          product.published
                            ? "rr-admin-badge--success"
                            : "rr-admin-badge--warning"
                        }`}
                      >
                        {product.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      {product.badge ? (
                        <span className="rr-admin-badge rr-admin-badge--info">
                          {product.badge}
                        </span>
                      ) : (
                        <span className="rr-admin-mutedText">No badge</span>
                      )}
                    </td>
                    <td>
                      <span className="rr-admin-tableMetric">
                        ₹{parsePrice(product.price).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <div className="rr-admin-tableActions">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="rr-admin-button rr-admin-button--secondary"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/products/${product._id}`}
                          className="rr-admin-button rr-admin-button--ghost"
                        >
                          <ArrowUpRight size={16} />
                          Preview
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="rr-admin-pagination">
            <p className="rr-admin-paginationMeta">
              Page {currentPage} of {totalPages}
            </p>
            {totalPages > 1 ? (
              <div className="rr-admin-paginationButtons">
                <button
                  type="button"
                  className="rr-admin-paginationButton"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Prev
                </button>
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                    className={
                      pageNumber === currentPage
                        ? "rr-admin-paginationButton rr-admin-paginationButton--active"
                        : "rr-admin-paginationButton"
                    }
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  className="rr-admin-paginationButton"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
