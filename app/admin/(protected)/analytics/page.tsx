"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  FolderTree,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Tags,
} from "lucide-react";
import styles from "./analytics.module.css";
import { getErrorMessage } from "@/lib/error-utils";

const BACKEND_BASE = "https://rani-riwaaj-backend-ylbq.vercel.app";
const CHART_COLORS = ["#2563eb", "#06b6d4", "#7c3aed", "#0f9f73", "#ef4444"];

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
    const tagMap = new Map(tags.map((tag) => [tag._id, tag.name]));

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
      })
      .slice(0, 5);

    const orphanCategories = categories.filter(
      (category) => !products.some((product) => product.category === category._id)
    );

    const recentProducts = [...products]
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      })
      .slice(0, 5);

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
      categoryMap,
      tagMap,
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
          <h1 className={styles.heroTitle}>Catalog analytics.</h1>
          <p className={styles.heroText}>
            Live product, taxonomy, coverage, and readiness signals.
          </p>

          <div className={styles.heroMeta}>
            <span className={styles.metaPill}>
              <Sparkles size={14} />
              Live sync
            </span>
            <span className={styles.metaPill}>
              <PackageCheck size={14} />
              {numberFormatter.format(analytics.totalProducts)} products
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
              <div className={styles.storyGauge}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    data={[{ value: readinessScore }]}
                    innerRadius="68%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    barSize={16}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      tick={false}
                    />
                    <RadialBar
                      dataKey="value"
                      cornerRadius={999}
                      background={{ fill: "rgba(23, 32, 51, 0.08)" }}
                      fill="#2563eb"
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className={styles.storyGaugeCenter}>
                  <div className={styles.storyScoreValue}>
                    {readinessScore}
                    <span>/100</span>
                  </div>
                  <p className={styles.storyScoreCaption}>Readiness</p>
                </div>
              </div>
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

      <section className={styles.grid}>
        <Panel
          tone="teal"
          eyebrow="Momentum"
          title="Catalog growth over time"
          subtitle="Products added by month with live and draft split."
        >
          {analytics.timeline.length === 0 ? (
            <EmptyPlot message="No valid creation dates are available yet." />
          ) : analytics.timeline.length < 2 ? (
            <LowDataState latest={analytics.timeline[analytics.timeline.length - 1]} />
          ) : (
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.38} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="added"
                    stroke="#2563eb"
                    fill="url(#growthGradient)"
                    strokeWidth={3}
                    name="Added"
                  />
                  <Area
                    type="monotone"
                    dataKey="published"
                    stroke="#06b6d4"
                    fill="transparent"
                    strokeWidth={2}
                    name="Published"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartShell>
          )}
        </Panel>

        <Panel
          tone="orange"
          eyebrow="Publishing"
          title="Live vs draft split"
          subtitle="Current live and draft balance."
        >
          {analytics.publicationSplit.length === 0 ? (
            <EmptyPlot message="No publication status data is available." />
          ) : (
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.publicationSplit}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={94}
                    paddingAngle={4}
                  >
                    {analytics.publicationSplit.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? "#2563eb" : "#06b6d4"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => numberFormatter.format(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartShell>
          )}
        </Panel>

        <Panel
          tone="gold"
          eyebrow="Taxonomy"
          title="Category mix"
          subtitle="Distribution across mapped categories."
        >
          {analytics.categoryMix.length === 0 ? (
            <EmptyPlot message="Add category assignments to unlock category analysis." />
          ) : (
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.categoryMix}
                  layout="vertical"
                  margin={{ top: 6, right: 12, left: 12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => numberFormatter.format(value)}
                  />
                  <Bar dataKey="count" radius={[0, 12, 12, 0]} fill="#16233b" />
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
          )}
        </Panel>

        <Panel
          tone="rose"
          eyebrow="Pricing"
          title="Price architecture"
          subtitle="Distribution by price band."
        >
          <ChartShell>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.priceBands} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </Panel>

        <Panel
          tone="plum"
          eyebrow="Quality"
          title="Catalog readiness"
          subtitle="Scored on media, description, category, pricing, and tags or variants."
        >
          {analytics.qualityBreakdown.length === 0 ? (
            <EmptyPlot message="Quality scoring becomes available as products are added." />
          ) : (
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.qualityBreakdown} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => numberFormatter.format(value)} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {analytics.qualityBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
          )}
        </Panel>

        <Panel
          tone="slate"
          eyebrow="Merchandising"
          title="Top value products"
          subtitle="Highest priced products in the current catalog."
        >
          {analytics.topValueProducts.length === 0 ? (
            <EmptyPlot message="No price data is available yet." />
          ) : (
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.topValueProducts}
                  layout="vertical"
                  margin={{ top: 6, right: 12, left: 12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
          )}
        </Panel>
      </section>

      <section className={styles.grid}>
        <Panel
          tone="rose"
          eyebrow="Attention"
          title="Products needing cleanup"
          subtitle="Highest priority items across media, taxonomy, state, and variants."
        >
          {analytics.attentionProducts.length === 0 ? (
            <EmptyPlot message="Everything looks clean right now." />
          ) : (
            <ul className={styles.list}>
              {analytics.attentionProducts.map((product) => (
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
          subtitle="Latest catalog entries with status and value."
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
            <ul className={styles.compactList}>
              {analytics.recentProducts.map((product) => (
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
          </div>
        </Panel>
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

function EmptyPlot({ message }: { message: string }) {
  return (
    <div className={styles.emptyPlot}>
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  );
}

function ChartShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.chartShell}>{children}</div>;
}

function LowDataState({
  latest,
}: {
  latest: { label: string; added: number; published: number; drafts: number };
}) {
  return (
    <div className={styles.lowDataState}>
      <div className={styles.lowDataHeader}>
        <p className={styles.lowDataEyebrow}>Limited history</p>
        <h3 className={styles.lowDataTitle}>
          One month of history is available so far.
        </h3>
        <p className={styles.lowDataText}>
          This view stays real instead of drawing a fake trend. More product
          history will unlock the full chart automatically.
        </p>
      </div>
      <div className={styles.lowDataGrid}>
        <div className={styles.lowDataMetric}>
          <span className={styles.lowDataMetricLabel}>Period</span>
          <strong className={styles.lowDataMetricValue}>{latest.label}</strong>
        </div>
        <div className={styles.lowDataMetric}>
          <span className={styles.lowDataMetricLabel}>Added</span>
          <strong className={styles.lowDataMetricValue}>{latest.added}</strong>
        </div>
        <div className={styles.lowDataMetric}>
          <span className={styles.lowDataMetricLabel}>Published</span>
          <strong className={styles.lowDataMetricValue}>{latest.published}</strong>
        </div>
        <div className={styles.lowDataMetric}>
          <span className={styles.lowDataMetricLabel}>Drafts</span>
          <strong className={styles.lowDataMetricValue}>{latest.drafts}</strong>
        </div>
      </div>
    </div>
  );
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
