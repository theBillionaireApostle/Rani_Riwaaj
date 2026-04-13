"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  FolderTree,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  Tags,
} from "lucide-react";
import styles from "./analytics.module.css";
import type { AnalyticsTab } from "./AnalyticsVisuals";
import { getErrorMessage } from "@/lib/error-utils";

const BACKEND_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";
const AnalyticsVisuals = dynamic(
  () => import("./AnalyticsVisuals").then((module) => module.AnalyticsVisuals),
  {
    ssr: false,
    loading: () => <VisualsLoadingState />,
  }
);

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

interface ProductImage {
  url?: string;
}

interface ProductRecord {
  _id: string;
  name: string;
  price: string | number;
  desc?: string;
  defaultImage?: ProductImage;
  globalImages?: ProductImage[];
  imagesByColor?: Record<string, ProductImage[]>;
  colors?: string[];
  sizes?: Array<string | { label?: string; badge?: string }>;
  badge?: string;
  justIn?: boolean;
  published?: boolean;
  category?: string;
  tags?: string[];
  discount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryRecord {
  _id: string;
  name: string;
  slug: string;
}

interface TagRecord {
  _id: string;
  name: string;
  slug: string;
}

interface FetchIssue {
  resource: string;
  message: string;
}

interface Snapshot {
  products: ProductRecord[];
  categories: CategoryRecord[];
  tags: TagRecord[];
  issues: FetchIssue[];
  fetchedAt: string | null;
}

interface InsightProduct {
  _id: string;
  name: string;
  price: number;
  categoryName: string;
  createdAt?: string;
  reasons: string[];
}

type Tone = "teal" | "orange" | "slate" | "gold" | "plum" | "rose";

function parsePrice(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = value.replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0);
}

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatRelativeTime(value: string | null): string {
  if (!value) return "Never";

  const diffMs = Date.now() - new Date(value).getTime();
  if (diffMs < 60_000) return "Just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return formatDate(value);
}

function getImageCount(product: ProductRecord): number {
  const heroCount = product.defaultImage?.url ? 1 : 0;
  const globalCount = (product.globalImages ?? []).filter((img) => img?.url).length;
  const colorCount = Object.values(product.imagesByColor ?? {}).reduce(
    (total, images) => total + images.filter((img) => img?.url).length,
    0
  );

  return heroCount + globalCount + colorCount;
}

function hasVariants(product: ProductRecord): boolean {
  return (product.colors?.length ?? 0) > 0 || (product.sizes?.length ?? 0) > 0;
}

function hasRichDescription(product: ProductRecord): boolean {
  return (product.desc ?? "").replace(/\s+/g, " ").trim().length >= 60;
}

function hasKnownCategory(
  product: ProductRecord,
  categoryIds: Set<string>,
  categoryIndexAvailable: boolean
): boolean {
  if (!product.category) return false;
  return categoryIndexAvailable ? categoryIds.has(product.category) : true;
}

function hasKnownTags(
  product: ProductRecord,
  tagIds: Set<string>,
  tagIndexAvailable: boolean
): boolean {
  if (!Array.isArray(product.tags) || product.tags.length === 0) return false;
  return tagIndexAvailable
    ? product.tags.some((tagId) => tagIds.has(tagId))
    : product.tags.length > 0;
}

function getQualityScore(
  product: ProductRecord,
  categoryIds: Set<string>,
  categoryIndexAvailable: boolean,
  tagIds: Set<string>,
  tagIndexAvailable: boolean
): number {
  let score = 0;

  if (parsePrice(product.price) > 0) score += 1;
  if (getImageCount(product) > 0) score += 1;
  if (hasRichDescription(product)) score += 1;
  if (hasKnownCategory(product, categoryIds, categoryIndexAvailable)) score += 1;
  if (hasKnownTags(product, tagIds, tagIndexAvailable) || hasVariants(product)) {
    score += 1;
  }

  return score;
}

function getAttentionReasons(
  product: ProductRecord,
  categoryIds: Set<string>,
  categoryIndexAvailable: boolean,
  tagIds: Set<string>,
  tagIndexAvailable: boolean
): string[] {
  const reasons: string[] = [];

  if (!product.published) reasons.push("Draft");
  if (getImageCount(product) === 0) reasons.push("Missing imagery");
  if (!(product.desc ?? "").trim()) reasons.push("Missing description");
  else if (!hasRichDescription(product)) reasons.push("Thin description");
  if (!product.category) reasons.push("Unassigned");
  else if (
    categoryIndexAvailable &&
    !hasKnownCategory(product, categoryIds, categoryIndexAvailable)
  ) {
    reasons.push("Broken category link");
  }
  if (!hasKnownTags(product, tagIds, tagIndexAvailable)) reasons.push("No tags");
  if (!hasVariants(product)) reasons.push("No variants");

  return reasons;
}

function buildTimeline(products: ProductRecord[]) {
  const grouped = new Map<
    string,
    { label: string; added: number; published: number; drafts: number }
  >();

  products.forEach((product) => {
    if (!product.createdAt) return;
    const createdAt = new Date(product.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const monthKey = `${createdAt.getFullYear()}-${String(
      createdAt.getMonth() + 1
    ).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "2-digit",
    }).format(createdAt);

    const current = grouped.get(monthKey) ?? {
      label,
      added: 0,
      published: 0,
      drafts: 0,
    };

    current.added += 1;
    if (product.published) current.published += 1;
    else current.drafts += 1;

    grouped.set(monthKey, current);
  });

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, value]) => value)
    .slice(-6);
}

async function fetchCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(`${BACKEND_BASE}${path}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error(`Unexpected payload received from ${path}`);
  }

  return payload as T[];
}

function resolveResult<T>(
  result: PromiseSettledResult<T[]>,
  fallback: T[],
  resource: string,
  issues: FetchIssue[]
): T[] {
  if (result.status === "fulfilled") {
    return result.value;
  }

  issues.push({
    resource,
    message: getErrorMessage(result.reason, `Failed to load ${resource}`),
  });
  return fallback;
}

export default function AnalyticsPage() {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    products: [],
    categories: [],
    tags: [],
    issues: [],
    fetchedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startRefresh] = useTransition();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("momentum");
  const [attentionPage, setAttentionPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [tagPage, setTagPage] = useState(1);

  const refreshAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      const [productsResult, categoriesResult, tagsResult] = await Promise.allSettled([
        fetchCollection<ProductRecord>("/api/products"),
        fetchCollection<CategoryRecord>("/api/categories"),
        fetchCollection<TagRecord>("/api/tags"),
      ]);

      const fetchedAt = new Date().toISOString();

      startRefresh(() => {
        setSnapshot((previous) => {
          const issues: FetchIssue[] = [];

          return {
            products: resolveResult(
              productsResult,
              previous.products,
              "products",
              issues
            ),
            categories: resolveResult(
              categoriesResult,
              previous.categories,
              "categories",
              issues
            ),
            tags: resolveResult(tagsResult, previous.tags, "tags", issues),
            issues,
            fetchedAt,
          };
        });
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshAnalytics();
  }, [refreshAnalytics]);

  const analytics = useMemo(() => {
    const products = snapshot.products;
    const categories = snapshot.categories;
    const tags = snapshot.tags;
    const categoryIds = new Set(categories.map((category) => category._id));
    const tagIds = new Set(tags.map((tag) => tag._id));
    const categoryIndexAvailable = categories.length > 0;
    const tagIndexAvailable = tags.length > 0;
    const categoryMap = new Map(categories.map((category) => [category._id, category.name]));

    const totalProducts = products.length;
    const publishedProducts = products.filter((product) => product.published);
    const draftProducts = products.filter((product) => !product.published);
    const justInProducts = products.filter((product) => product.justIn);
    const discountedProducts = products.filter(
      (product) => Number(product.discount ?? 0) > 0
    );
    const productsWithImages = products.filter((product) => getImageCount(product) > 0);
    const productsWithDescriptions = products.filter((product) =>
      Boolean((product.desc ?? "").trim())
    );
    const categorizedProducts = products.filter((product) =>
      hasKnownCategory(product, categoryIds, categoryIndexAvailable)
    );
    const mappedTagProducts = products.filter((product) =>
      hasKnownTags(product, tagIds, tagIndexAvailable)
    );
    const brokenCategoryLinks = products.filter(
      (product) =>
        Boolean(product.category) &&
        categoryIndexAvailable &&
        !categoryIds.has(product.category as string)
    );
    const brokenTagLinks = products.filter(
      (product) =>
        Array.isArray(product.tags) &&
        tagIndexAvailable &&
        product.tags.some((tagId) => !tagIds.has(tagId))
    );

    const priceValues = products
      .map((product) => parsePrice(product.price))
      .filter((value) => value > 0)
      .sort((left, right) => left - right);

    const catalogValue = priceValues.reduce((sum, value) => sum + value, 0);
    const averagePrice = priceValues.length
      ? catalogValue / priceValues.length
      : 0;
    const medianPrice =
      priceValues.length === 0
        ? 0
        : priceValues.length % 2 === 1
          ? priceValues[(priceValues.length - 1) / 2]
          : (priceValues[priceValues.length / 2 - 1] +
              priceValues[priceValues.length / 2]) /
            2;

    const qualityBreakdown = [
      { name: "Complete", value: 0 },
      { name: "Strong", value: 0 },
      { name: "Needs Work", value: 0 },
      { name: "Critical", value: 0 },
    ];

    const readyToPublishDrafts = draftProducts.filter((product) => {
      const score = getQualityScore(
        product,
        categoryIds,
        categoryIndexAvailable,
        tagIds,
        tagIndexAvailable
      );
      return score >= 4;
    }).length;

    const staleDrafts = draftProducts.filter((product) => {
      if (!product.createdAt) return false;
      const ageInDays =
        (Date.now() - new Date(product.createdAt).getTime()) / 86_400_000;
      return Number.isFinite(ageInDays) && ageInDays >= 30;
    });

    products.forEach((product) => {
      const score = getQualityScore(
        product,
        categoryIds,
        categoryIndexAvailable,
        tagIds,
        tagIndexAvailable
      );

      if (score === 5) qualityBreakdown[0].value += 1;
      else if (score >= 3) qualityBreakdown[1].value += 1;
      else if (score >= 1) qualityBreakdown[2].value += 1;
      else qualityBreakdown[3].value += 1;
    });

    const categoryMix = categories
      .map((category) => {
        const items = products.filter((product) => product.category === category._id);
        return {
          name: category.name,
          count: items.length,
          value: items.reduce((sum, product) => sum + parsePrice(product.price), 0),
        };
      })
      .filter((entry) => entry.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);

    const unmappedProducts = products.filter(
      (product) => !hasKnownCategory(product, categoryIds, categoryIndexAvailable)
    );
    if (unmappedProducts.length > 0) {
      categoryMix.push({
        name: "Unmapped",
        count: unmappedProducts.length,
        value: unmappedProducts.reduce(
          (sum, product) => sum + parsePrice(product.price),
          0
        ),
      });
    }

    const priceBands = [
      {
        name: "Under 1.5k",
        value: products.filter((product) => parsePrice(product.price) < 1500).length,
      },
      {
        name: "1.5k - 2.9k",
        value: products.filter((product) => {
          const price = parsePrice(product.price);
          return price >= 1500 && price < 3000;
        }).length,
      },
      {
        name: "3k - 4.4k",
        value: products.filter((product) => {
          const price = parsePrice(product.price);
          return price >= 3000 && price < 4500;
        }).length,
      },
      {
        name: "4.5k+",
        value: products.filter((product) => parsePrice(product.price) >= 4500).length,
      },
    ];

    const publicationSplit = [
      { name: "Published", value: publishedProducts.length },
      { name: "Draft", value: draftProducts.length },
    ].filter((entry) => entry.value > 0);

    const topValueProducts = [...products]
      .map((product) => ({
        name: product.name,
        value: parsePrice(product.price),
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);

    const duplicateGroups = new Map<string, ProductRecord[]>();
    products.forEach((product) => {
      const key = product.name.trim().toLowerCase();
      if (!key) return;
      const current = duplicateGroups.get(key) ?? [];
      current.push(product);
      duplicateGroups.set(key, current);
    });

    const duplicateNameGroups = Array.from(duplicateGroups.values()).filter(
      (group) => group.length > 1
    );

    const attentionProducts: InsightProduct[] = [...products]
      .map((product) => ({
        _id: product._id,
        name: product.name,
        price: parsePrice(product.price),
        categoryName: product.category
          ? categoryMap.get(product.category) ??
            (categoryIndexAvailable ? "Broken category link" : "Category assigned")
          : "Unassigned",
        createdAt: product.createdAt,
        reasons: getAttentionReasons(
          product,
          categoryIds,
          categoryIndexAvailable,
          tagIds,
          tagIndexAvailable
        ),
      }))
      .filter((product) => product.reasons.length > 0)
      .sort((left, right) => {
        if (right.reasons.length !== left.reasons.length) {
          return right.reasons.length - left.reasons.length;
        }
        return right.price - left.price;
      });

    const orphanCategories = categories.filter(
      (category) => !products.some((product) => product.category === category._id)
    );

    const recentProducts = [...products]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });

    const tagUsage = tags
      .map((tag) => ({
        name: tag.name,
        count: products.filter((product) => product.tags?.includes(tag._id)).length,
      }))
      .filter((tag) => tag.count > 0)
      .sort((left, right) => right.count - left.count);

    return {
      totalProducts,
      totalCategories: categories.length,
      totalTags: tags.length,
      catalogValue,
      averagePrice,
      medianPrice,
      publishedCount: publishedProducts.length,
      draftCount: draftProducts.length,
      justInCount: justInProducts.length,
      discountedCount: discountedProducts.length,
      imageCoverage:
        totalProducts === 0 ? 0 : (productsWithImages.length / totalProducts) * 100,
      descriptionCoverage:
        totalProducts === 0
          ? 0
          : (productsWithDescriptions.length / totalProducts) * 100,
      categoryCoverage:
        totalProducts === 0 ? 0 : (categorizedProducts.length / totalProducts) * 100,
      tagCoverage:
        totalProducts === 0 ? 0 : (mappedTagProducts.length / totalProducts) * 100,
      readyToPublishDrafts,
      staleDraftCount: staleDrafts.length,
      brokenCategoryLinkCount: brokenCategoryLinks.length,
      brokenTagLinkCount: brokenTagLinks.length,
      duplicateNameGroupCount: duplicateNameGroups.length,
      attentionCount: attentionProducts.length,
      timeline: buildTimeline(products),
      categoryMix,
      priceBands,
      publicationSplit,
      qualityBreakdown: qualityBreakdown.filter((entry) => entry.value > 0),
      topValueProducts,
      attentionProducts,
      orphanCategories,
      recentProducts,
      tagUsage,
    };
  }, [snapshot]);

  const productIssue = snapshot.issues.find((issue) => issue.resource === "products");
  const isBusy = loading || isRefreshing;
  const publishRate =
    analytics.totalProducts === 0
      ? 0
      : Math.round((analytics.publishedCount / analytics.totalProducts) * 100);
  const readinessScore = Math.round(
    (analytics.imageCoverage +
      analytics.descriptionCoverage +
      analytics.categoryCoverage +
      analytics.tagCoverage +
      publishRate) /
      5
  );
  const leadingCategory =
    analytics.categoryMix.find((entry) => entry.name !== "Unmapped") ??
    analytics.categoryMix[0];
  const leadingPriceBand = [...analytics.priceBands].sort(
    (left, right) => right.value - left.value
  )[0];
  const summaryLine =
    analytics.attentionCount > 0
      ? `${numberFormatter.format(analytics.totalProducts)} products in the catalog, ${numberFormatter.format(
          analytics.publishedCount
        )} live, with ${numberFormatter.format(
          analytics.attentionCount
        )} items pulling quality down.`
      : `${numberFormatter.format(analytics.totalProducts)} products in the catalog, ${numberFormatter.format(
          analytics.publishedCount
        )} live, and the current structure is holding cleanly.`;
  const coverageItems = [
    {
      label: "Image coverage",
      value: analytics.imageCoverage,
      target: 95,
      tone: "teal" as Tone,
    },
    {
      label: "Description depth",
      value: analytics.descriptionCoverage,
      target: 90,
      tone: "orange" as Tone,
    },
    {
      label: "Category mapping",
      value: analytics.categoryCoverage,
      target: 100,
      tone: "gold" as Tone,
    },
    {
      label: "Tag adoption",
      value: analytics.tagCoverage,
      target: 80,
      tone: "plum" as Tone,
    },
  ];
  const focusActions = [
    {
      title:
        analytics.attentionCount > 0
          ? `Resolve ${analytics.attentionCount} product issues`
          : "Catalog cleanup is under control",
      description:
        analytics.attentionCount > 0
          ? "Prioritize missing imagery, thin copy, draft items, and broken taxonomy links."
          : "Use this space to polish merchandising details instead of fixing blockers.",
      href: "/admin",
      cta: analytics.attentionCount > 0 ? "Open product desk" : "Review products",
      tone: "rose" as Tone,
    },
    {
      title:
        analytics.readyToPublishDrafts > 0
          ? `${analytics.readyToPublishDrafts} drafts are ready to publish`
          : "Draft queue needs more work before launch",
      description:
        analytics.readyToPublishDrafts > 0
          ? "These items already have enough content quality to go live confidently."
          : "Strengthen descriptions, category links, imagery, and tags before publishing.",
      href: "/admin",
      cta: "Inspect drafts",
      tone: "teal" as Tone,
    },
    {
      title:
        analytics.orphanCategories.length > 0 || analytics.brokenCategoryLinkCount > 0
          ? "Taxonomy needs attention"
          : "Category structure looks healthy",
      description:
        analytics.orphanCategories.length > 0 || analytics.brokenCategoryLinkCount > 0
          ? `${analytics.orphanCategories.length} empty categories and ${analytics.brokenCategoryLinkCount} broken category links found.`
          : "Every current category is anchored to real products and link integrity is intact.",
      href: "/admin/categories",
      cta: "Review categories",
      tone: "gold" as Tone,
    },
  ];
  const attentionView = getPageWindow(analytics.attentionProducts, attentionPage, 3);
  const recentView = getPageWindow(analytics.recentProducts, recentPage, 4);
  const tagView = getPageWindow(analytics.tagUsage, tagPage, 5);

  if (loading && snapshot.fetchedAt === null) {
    return <LoadingState />;
  }

  if (snapshot.products.length === 0) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Catalog Overview</span>
            <h1 className={styles.heroTitle}>No catalog data yet.</h1>
            <p className={styles.heroText}>
              {productIssue
                ? productIssue.message
                : "Add products to unlock analytics."}
            </p>
          </div>
          <div className={styles.heroActions}>
            <button
              type="button"
              onClick={() => void refreshAnalytics()}
              className={styles.primaryButton}
              disabled={isBusy}
            >
              <RefreshCw className={isBusy ? styles.spin : ""} />
              Retry
            </button>
            <Link href="/admin" className={styles.secondaryButton}>
              Add Products
              <ArrowRight />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Catalog Overview</span>
          <h1 className={styles.heroTitle}>Catalog intelligence.</h1>
          <p className={styles.heroText}>
            {summaryLine}
          </p>

          <div className={styles.heroMeta}>
            <span className={styles.metaPill}>
              <ShieldAlert size={14} />
              {numberFormatter.format(analytics.attentionCount)} need attention
            </span>
            <span className={styles.metaPill}>
              <PackageCheck size={14} />
              {numberFormatter.format(analytics.totalProducts)} products
            </span>
            <span className={styles.metaPill}>
              <FolderTree size={14} />
              {leadingCategory?.name ?? "Unmapped"} leads structure
            </span>
            <span className={styles.metaPill}>
              <RefreshCw size={14} />
              Synced {formatRelativeTime(snapshot.fetchedAt)}
            </span>
          </div>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            onClick={() => void refreshAnalytics()}
            className={styles.primaryButton}
            disabled={isBusy}
          >
            <RefreshCw className={isBusy ? styles.spin : ""} />
            {isBusy ? "Refreshing..." : "Refresh Data"}
          </button>
          <Link href="/admin" className={styles.secondaryButton}>
            Manage Products
            <ArrowRight />
          </Link>
          <Link href="/admin/categories" className={styles.secondaryButton}>
            Categories
            <ArrowRight />
          </Link>
        </div>
      </section>

      {snapshot.issues.length > 0 && (
        <section className={styles.warningBanner}>
          <div className={styles.warningHeader}>
            <AlertTriangle size={18} />
            <strong>Partial data loaded</strong>
          </div>
          <div className={styles.warningList}>
            {snapshot.issues.map((issue) => (
              <span key={issue.resource} className={styles.warningItem}>
                {issue.resource}: {issue.message}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className={styles.statsGrid}>
        <StatCard
          icon={<CircleDollarSign size={20} />}
          tone="teal"
          label="Catalog value"
          value={formatCurrency(analytics.catalogValue)}
          meta={`Avg ${formatCurrency(analytics.averagePrice)} · Median ${formatCurrency(
            analytics.medianPrice
          )}`}
        />
        <StatCard
          icon={<PackageCheck size={20} />}
          tone="orange"
          label="Published products"
          value={numberFormatter.format(analytics.publishedCount)}
          meta={`${analytics.totalProducts === 0 ? 0 : Math.round(
            (analytics.publishedCount / analytics.totalProducts) * 100
          )}% of the catalog is live`}
        />
        <StatCard
          icon={<ShieldAlert size={20} />}
          tone="slate"
              label="Draft review queue"
              value={numberFormatter.format(analytics.draftCount)}
              meta={`${numberFormatter.format(
                analytics.readyToPublishDrafts
              )} ready to publish · ${numberFormatter.format(
            analytics.staleDraftCount
          )} stale drafts`}
        />
        <StatCard
          icon={<FolderTree size={20} />}
          tone="gold"
          label="Category coverage"
          value={`${Math.round(analytics.categoryCoverage)}%`}
          meta={`${numberFormatter.format(
            analytics.totalCategories
          )} categories · ${numberFormatter.format(
            analytics.orphanCategories.length
          )} empty`}
        />
        <StatCard
          icon={<Tags size={20} />}
          tone="plum"
          label="Tag adoption"
          value={`${Math.round(analytics.tagCoverage)}%`}
          meta={`${numberFormatter.format(
            analytics.totalTags
          )} tags · ${numberFormatter.format(
            analytics.brokenTagLinkCount
          )} broken refs`}
        />
        <StatCard
          icon={<Boxes size={20} />}
          tone="rose"
          label="Needs attention"
          value={numberFormatter.format(analytics.attentionCount)}
          meta={`${Math.round(analytics.imageCoverage)}% image coverage · ${Math.round(
            analytics.descriptionCoverage
          )}% description coverage`}
        />
      </section>

      <section className={styles.storyGrid}>
        <StoryCard
          tone="teal"
          eyebrow="Readiness"
          title="Catalog health"
        >
          <div className={styles.storyScoreRow}>
            <div className={styles.storyGaugeBlock}>
              <ReadinessDial value={readinessScore} />
            </div>
            <div className={styles.storyMiniGrid}>
              <MiniMetric
                label="Live now"
                value={`${publishRate}%`}
                tone="orange"
              />
              <MiniMetric
                label="Needs cleanup"
                value={numberFormatter.format(analytics.attentionCount)}
                tone="rose"
              />
              <MiniMetric
                label="Top category"
                value={leadingCategory?.name ?? "Unmapped"}
                tone="gold"
              />
              <MiniMetric
                label="Strongest price band"
                value={leadingPriceBand?.name ?? "Unknown"}
                tone="plum"
              />
            </div>
          </div>
          <p className={styles.storyText}>
            Publish rate, taxonomy, imagery, and product detail coverage are
            blended here into one operational read.
          </p>
        </StoryCard>

        <StoryCard
          tone="plum"
          eyebrow="Priority Queue"
          title="Next actions"
        >
          <div className={styles.storyActionList}>
            {focusActions.map((action) => (
              <div key={action.title} className={styles.storyActionItem}>
                <div className={styles.storyActionCopy}>
                  <div className={styles.storyActionTitleRow}>
                    <span
                      className={`${styles.storyActionDot} ${styles[`tone${capitalize(action.tone)}`]}`}
                    />
                    <p className={styles.storyActionTitle}>{action.title}</p>
                  </div>
                  <p className={styles.storyActionText}>{action.description}</p>
                </div>
                <Link href={action.href} className={styles.storyLink}>
                  {action.cta}
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </StoryCard>

        <StoryCard
          tone="gold"
          eyebrow="Coverage"
          title="Content and taxonomy coverage"
        >
          <div className={styles.coverageList}>
            {coverageItems.map((item) => (
              <CoverageMeter
                key={item.label}
                label={item.label}
                value={item.value}
                target={item.target}
                tone={item.tone}
              />
            ))}
          </div>
        </StoryCard>
      </section>

      <section className={styles.visualSection}>
        <div className={styles.visualHeader}>
          <div className={styles.visualCopy}>
            <span className={styles.panelEyebrow}>Signal Explorer</span>
            <h2 className={styles.visualTitle}>Chart layers</h2>
            <p className={styles.visualText}>
              Separate chart layers keep the page fast while preserving deeper structure,
              pricing, and merchandising reads.
            </p>
          </div>
          <div className={styles.visualTabs} role="tablist" aria-label="Analytics views">
            {[
              { key: "momentum", label: "Momentum" },
              { key: "structure", label: "Structure" },
              { key: "merchandising", label: "Merchandising" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={
                  activeTab === tab.key
                    ? `${styles.visualTab} ${styles.visualTabActive}`
                    : styles.visualTab
                }
                onClick={() => setActiveTab(tab.key as AnalyticsTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnalyticsVisuals
          activeTab={activeTab}
          timeline={analytics.timeline}
          publicationSplit={analytics.publicationSplit}
          categoryMix={analytics.categoryMix}
          priceBands={analytics.priceBands}
          qualityBreakdown={analytics.qualityBreakdown}
          topValueProducts={analytics.topValueProducts}
          tagUsage={analytics.tagUsage}
        />
      </section>

      <section className={styles.grid}>
        <Panel
          tone="rose"
          eyebrow="Attention"
          title="Products needing cleanup"
          subtitle="Highest priority items across media, taxonomy, state, and variants."
        >
          {analytics.attentionProducts.length === 0 ? (
            <div className={styles.emptyPlot}>
              <AlertTriangle size={18} />
              <span>Everything looks clean right now.</span>
            </div>
          ) : (
            <>
              <ul className={styles.list}>
                {attentionView.items.map((product) => (
                  <li key={product._id} className={styles.listItem}>
                    <div className={styles.listTopRow}>
                      <div>
                        <p className={styles.listTitle}>{product.name}</p>
                        <p className={styles.listMeta}>
                          {product.categoryName} · {formatCurrency(product.price)} · Added{" "}
                          {formatDate(product.createdAt)}
                        </p>
                      </div>
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className={styles.inlineLink}
                      >
                        Fix
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                    <div className={styles.reasonRow}>
                      {product.reasons.map((reason) => (
                        <span key={reason} className={styles.reasonPill}>
                          {reason}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <PaginationControls
                label={buildPageLabel(
                  attentionView.page,
                  attentionView.pageSize,
                  analytics.attentionProducts.length
                )}
                page={attentionView.page}
                totalPages={attentionView.totalPages}
                onPageChange={setAttentionPage}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="gold"
          eyebrow="Signals"
          title="Operational watchlist"
          subtitle="Edge cases and maintenance risks."
        >
          <div className={styles.watchlist}>
            <WatchMetric
              label="Just In items"
              value={analytics.justInCount}
              detail="Freshly flagged arrivals"
            />
            <WatchMetric
              label="Discounted products"
              value={analytics.discountedCount}
              detail="Products carrying an active discount"
            />
            <WatchMetric
              label="Broken category links"
              value={analytics.brokenCategoryLinkCount}
              detail="Products linked to missing categories"
              danger={analytics.brokenCategoryLinkCount > 0}
            />
            <WatchMetric
              label="Broken tag links"
              value={analytics.brokenTagLinkCount}
              detail="Products referencing missing tags"
              danger={analytics.brokenTagLinkCount > 0}
            />
            <WatchMetric
              label="Duplicate name groups"
              value={analytics.duplicateNameGroupCount}
              detail="Potential duplicate or conflicting listings"
              danger={analytics.duplicateNameGroupCount > 0}
            />
            <WatchMetric
              label="Orphan categories"
              value={analytics.orphanCategories.length}
              detail={
                analytics.orphanCategories.length > 0
                  ? analytics.orphanCategories.map((category) => category.name).join(", ")
                  : "Every category has at least one product"
              }
              danger={analytics.orphanCategories.length > 0}
            />
          </div>
        </Panel>

        <Panel
          tone="slate"
          eyebrow="Recent"
          title="Recent additions"
          subtitle="Latest catalog entries and tag usage."
        >
          <div className={styles.subsection}>
            <div className={styles.subsectionHeader}>
              <h3 className={styles.subsectionTitle}>Latest products</h3>
              <span className={styles.subsectionMeta}>
                {analytics.tagUsage.length > 0
                  ? `Top tag: ${analytics.tagUsage[0].name}`
                  : "No tag usage yet"}
              </span>
            </div>
            {recentView.items.length > 0 ? (
              <>
                <ul className={styles.compactList}>
                  {recentView.items.map((product) => (
                    <li key={product._id} className={styles.compactItem}>
                      <div>
                        <p className={styles.compactTitle}>{product.name}</p>
                        <p className={styles.compactMeta}>
                          {formatDate(product.createdAt)} ·{" "}
                          {product.published ? "Published" : "Draft"}
                        </p>
                      </div>
                      <span className={styles.compactValue}>
                        {formatCurrency(parsePrice(product.price))}
                      </span>
                    </li>
                  ))}
                </ul>
                <PaginationControls
                  label={buildPageLabel(
                    recentView.page,
                    recentView.pageSize,
                    analytics.recentProducts.length
                  )}
                  page={recentView.page}
                  totalPages={recentView.totalPages}
                  onPageChange={setRecentPage}
                />
              </>
            ) : (
              <div className={styles.emptyPlot}>
                <AlertTriangle size={18} />
                <span>No recent additions are available yet.</span>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          <div className={styles.subsection}>
            <div className={styles.subsectionHeader}>
              <h3 className={styles.subsectionTitle}>Tag adoption</h3>
              <span className={styles.subsectionMeta}>
                {numberFormatter.format(analytics.totalTags)} tags in the system
              </span>
            </div>
            {tagView.items.length > 0 ? (
              <>
                <ul className={styles.compactList}>
                  {tagView.items.map((tag) => (
                    <li key={tag.name} className={styles.compactItem}>
                      <div>
                        <p className={styles.compactTitle}>{tag.name}</p>
                        <p className={styles.compactMeta}>
                          Referenced across the active catalog
                        </p>
                      </div>
                      <span className={styles.compactValue}>
                        {numberFormatter.format(tag.count)}
                      </span>
                    </li>
                  ))}
                </ul>
                <PaginationControls
                  label={buildPageLabel(
                    tagView.page,
                    tagView.pageSize,
                    analytics.tagUsage.length
                  )}
                  page={tagView.page}
                  totalPages={tagView.totalPages}
                  onPageChange={setTagPage}
                />
              </>
            ) : (
              <div className={styles.emptyPlot}>
                <AlertTriangle size={18} />
                <span>No tag adoption data is available yet.</span>
              </div>
            )}
          </div>
        </Panel>
      </section>

      <section className={styles.utilityStrip}>
        <div className={styles.utilityItem}>
          <span className={styles.utilityLabel}>Last sync</span>
          <strong className={styles.utilityValue}>{formatRelativeTime(snapshot.fetchedAt)}</strong>
          <span className={styles.utilityMeta}>Freshest catalog snapshot in this session</span>
        </div>
        <div className={styles.utilityItem}>
          <span className={styles.utilityLabel}>Dominant price band</span>
          <strong className={styles.utilityValue}>{leadingPriceBand?.name ?? "Unknown"}</strong>
          <span className={styles.utilityMeta}>Most populated pricing tier right now</span>
        </div>
        <div className={styles.utilityItem}>
          <span className={styles.utilityLabel}>Export readiness</span>
          <strong className={styles.utilityValue}>
            {snapshot.issues.length === 0 ? "Stable" : "Partial"}
          </strong>
          <span className={styles.utilityMeta}>
            {snapshot.issues.length === 0
              ? "All core catalog sources loaded cleanly."
              : "Some dependent resources need another refresh."}
          </span>
        </div>
      </section>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.page}>
      <section className={`${styles.hero} ${styles.skeletonBlock}`} />
      <section className={styles.statsGrid}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`${styles.statCard} ${styles.skeletonBlock}`} />
        ))}
      </section>
      <section className={styles.grid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`${styles.panel} ${styles.skeletonBlock}`} />
        ))}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  meta,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta: string;
  tone: "teal" | "orange" | "slate" | "gold" | "plum" | "rose";
}) {
  return (
    <article className={styles.statCard}>
      <div className={`${styles.statIcon} ${styles[`tone${capitalize(tone)}`]}`}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statMeta}>{meta}</p>
      </div>
    </article>
  );
}

function Panel({
  eyebrow,
  title,
  subtitle,
  children,
  wide = false,
  tone = "slate",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  wide?: boolean;
  tone?: Tone;
}) {
  return (
    <article
      className={[
        styles.panel,
        wide ? styles.panelWide : "",
        styles[`panelTone${capitalize(tone)}`],
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.panelHeader}>
        <span className={styles.panelEyebrow}>{eyebrow}</span>
        <h2 className={styles.panelTitle}>{title}</h2>
        <p className={styles.panelSubtitle}>{subtitle}</p>
      </div>
      {children}
    </article>
  );
}

function ReadinessDial({ value }: { value: number }) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className={styles.storyGauge}
      style={{ "--dial-value": `${clampedValue}%` } as CSSProperties}
    >
      <div className={styles.storyGaugeCenter}>
        <div className={styles.storyScoreValue}>
          {clampedValue}
          <span>/100</span>
        </div>
        <p className={styles.storyScoreCaption}>Readiness</p>
      </div>
    </div>
  );
}

function PaginationControls({
  label,
  page,
  totalPages,
  onPageChange,
}: {
  label: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getVisiblePageNumbers(page, totalPages);

  return (
    <div className={styles.paginationRow}>
      <p className={styles.paginationMeta}>{label}</p>
      {totalPages > 1 ? (
        <div className={styles.paginationControls}>
          <button
            type="button"
            className={styles.paginationButton}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </button>
          {pages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-current={pageNumber === page ? "page" : undefined}
              className={
                pageNumber === page
                  ? `${styles.paginationButton} ${styles.paginationButtonActive}`
                  : styles.paginationButton
              }
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className={styles.paginationButton}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

function VisualsLoadingState() {
  return (
    <section className={styles.grid}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={`${styles.panel} ${styles.skeletonBlock} ${styles.visualLoadingCard}`}
        />
      ))}
    </section>
  );
}

function getPageWindow<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    page: safePage,
    pageSize,
    totalPages,
  };
}

function buildPageLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) {
    return "No records";
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `Showing ${start}-${end} of ${total}`;
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

function StoryCard({
  tone,
  eyebrow,
  title,
  children,
}: {
  tone: Tone;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`${styles.storyCard} ${styles[`storyTone${capitalize(tone)}`]}`}>
      <div className={styles.storyHeader}>
        <span className={styles.storyEyebrow}>{eyebrow}</span>
        <h2 className={styles.storyTitle}>{title}</h2>
      </div>
      {children}
    </article>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={styles.miniMetric}>
      <span className={`${styles.miniMetricDot} ${styles[`tone${capitalize(tone)}`]}`} />
      <p className={styles.miniMetricLabel}>{label}</p>
      <p className={styles.miniMetricValue}>{value}</p>
    </div>
  );
}

function CoverageMeter({
  label,
  value,
  target,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  tone: Tone;
}) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));
  const clampedTarget = Math.max(0, Math.min(100, target));

  return (
    <div className={styles.coverageItem}>
      <div className={styles.coverageTopRow}>
        <div>
          <p className={styles.coverageLabel}>{label}</p>
          <p className={styles.coverageHint}>Target {clampedTarget}%</p>
        </div>
        <p className={styles.coverageValue}>{clampedValue}%</p>
      </div>
      <div className={styles.coverageTrack}>
        <div
          className={`${styles.coverageFill} ${styles[`coverageFill${capitalize(tone)}`]}`}
          style={{ width: `${clampedValue}%` }}
        />
        <span
          className={styles.coverageTarget}
          style={{ left: `${clampedTarget}%` }}
        />
      </div>
    </div>
  );
}

function WatchMetric({
  label,
  value,
  detail,
  danger = false,
}: {
  label: string;
  value: number;
  detail: string;
  danger?: boolean;
}) {
  return (
    <div className={danger ? `${styles.watchMetric} ${styles.watchMetricDanger}` : styles.watchMetric}>
      <div>
        <p className={styles.watchLabel}>{label}</p>
        <p className={styles.watchDetail}>{detail}</p>
      </div>
      <span className={styles.watchValue}>{numberFormatter.format(value)}</span>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
