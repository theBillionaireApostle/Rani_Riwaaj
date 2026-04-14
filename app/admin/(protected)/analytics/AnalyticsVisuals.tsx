"use client";

import type { TooltipProps } from "recharts";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import styles from "./analytics.module.css";

const CHART_COLORS = ["#2563eb", "#06b6d4", "#7c3aed", "#14b8a6", "#ef4444"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

export type AnalyticsTab = "momentum" | "structure" | "merchandising";

interface TimelinePoint {
  label: string;
  added: number;
  published: number;
  drafts: number;
}

interface MetricPoint {
  name: string;
  value: number;
}

interface CategoryMixPoint {
  name: string;
  count: number;
  value: number;
}

interface TagUsagePoint {
  name: string;
  count: number;
}

interface AnalyticsVisualsProps {
  activeTab: AnalyticsTab;
  timeline: TimelinePoint[];
  publicationSplit: MetricPoint[];
  categoryMix: CategoryMixPoint[];
  priceBands: MetricPoint[];
  mappingHealth: MetricPoint[];
  stateMix: MetricPoint[];
  qualityBreakdown: MetricPoint[];
  topValueProducts: MetricPoint[];
  tagUsage: TagUsagePoint[];
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value || 0);
}

function truncateLabel(value: string, max = 14): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function AnalyticsVisuals({
  activeTab,
  timeline,
  publicationSplit,
  categoryMix,
  priceBands,
  mappingHealth,
  stateMix,
  qualityBreakdown,
  topValueProducts,
  tagUsage,
}: AnalyticsVisualsProps) {
  const publishedCount =
    publicationSplit.find((entry) => entry.name === "Published")?.value ?? 0;
  const draftCount = publicationSplit.find((entry) => entry.name === "Draft")?.value ?? 0;
  const publicationTotal = publishedCount + draftCount;
  const publishRate =
    publicationTotal > 0 ? Math.round((publishedCount / publicationTotal) * 100) : 0;
  const mappedCount = mappingHealth.find((entry) => entry.name === "Mapped")?.value ?? 0;
  const unmappedCount =
    mappingHealth.find((entry) => entry.name === "Unassigned")?.value ?? 0;
  const brokenCount = mappingHealth.find((entry) => entry.name === "Broken")?.value ?? 0;
  const dominantPriceBand =
    [...priceBands].sort((left, right) => right.value - left.value)[0] ?? null;
  const dominantState =
    [...stateMix].sort((left, right) => right.value - left.value)[0] ?? null;
  const leadingCategory = categoryMix.find((entry) => entry.name !== "Unmapped") ?? categoryMix[0];
  const topTag = tagUsage[0] ?? null;
  const qualityLeader =
    [...qualityBreakdown].sort((left, right) => right.value - left.value)[0] ?? null;
  const topValueLeader = topValueProducts[0] ?? null;
  const topValueAverage = topValueProducts.length
    ? Math.round(
        topValueProducts.reduce((total, entry) => total + entry.value, 0) /
          topValueProducts.length
      )
    : 0;
  if (activeTab === "momentum") {
    return (
      <section className={styles.grid}>
        <Panel
          tone="teal"
          eyebrow="Momentum"
          title="Catalog growth over time"
          subtitle="Products added by month with live and draft split."
          wide
        >
          {timeline.length === 0 ? (
            <EmptyPlot message="No valid creation dates are available yet." />
          ) : timeline.length < 2 ? (
            <LowDataState latest={timeline[timeline.length - 1]} />
          ) : (
            <>
              <ChartShell className={styles.chartShellTall}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeline}
                    margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="publishedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
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
                      fill="url(#publishedGradient)"
                      strokeWidth={2}
                      name="Published"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Latest window",
                    value: timeline[timeline.length - 1]?.label ?? "Unknown",
                    hint: `${numberFormatter.format(
                      timeline[timeline.length - 1]?.added ?? 0
                    )} products added`,
                  },
                  {
                    label: "Live in period",
                    value: numberFormatter.format(
                      timeline[timeline.length - 1]?.published ?? 0
                    ),
                    hint: "Published products in the latest month",
                  },
                  {
                    label: "Drafts in period",
                    value: numberFormatter.format(
                      timeline[timeline.length - 1]?.drafts ?? 0
                    ),
                    hint: "Draft pressure in the latest month",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="orange"
          eyebrow="Publishing"
          title="Live vs draft split"
          subtitle="Current live and draft balance."
        >
          {publicationSplit.length === 0 ? (
            <EmptyPlot message="No publication status data is available." />
          ) : (
            <>
              <ChartShell className={styles.chartShellCompact}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={publicationSplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={4}
                    >
                      {publicationSplit.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={index === 0 ? "#2563eb" : "#06b6d4"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                columns={3}
                items={[
                  {
                    label: "Live",
                    value: numberFormatter.format(publishedCount),
                    hint: "Currently published",
                  },
                  {
                    label: "Draft",
                    value: numberFormatter.format(draftCount),
                    hint: "Still off storefront",
                  },
                  {
                    label: "Publish rate",
                    value: `${publishRate}%`,
                    hint: "Share of catalog that is live",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="rose"
          eyebrow="Pricing"
          title="Price architecture"
          subtitle="Distribution by active price band."
        >
          <>
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priceBands}
                  margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(value) => numberFormatter.format(value)}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
            <MetricGrid
              items={[
                {
                  label: "Dominant band",
                  value: dominantPriceBand?.name ?? "Unknown",
                  hint: `${numberFormatter.format(dominantPriceBand?.value ?? 0)} products`,
                },
                {
                  label: "Bands tracked",
                  value: numberFormatter.format(priceBands.length),
                  hint: "Current pricing layers",
                },
              ]}
            />
          </>
        </Panel>

        <Panel
          tone="gold"
          eyebrow="Mapping"
          title="Category mapping health"
          subtitle="Mapped, unassigned, and broken taxonomy connections."
        >
          {mappingHealth.length === 0 ? (
            <EmptyPlot message="Category mapping data is not available yet." />
          ) : (
            <>
              <ChartShell>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mappingHealth}
                    layout="vertical"
                    margin={{ top: 6, right: 8, left: 12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                      {mappingHealth.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Mapped"
                              ? "#2563eb"
                              : entry.name === "Broken"
                                ? "#ef4444"
                                : "#14b8a6"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Mapped",
                    value: numberFormatter.format(mappedCount),
                    hint: "Linked to valid categories",
                  },
                  {
                    label: "Unassigned",
                    value: numberFormatter.format(unmappedCount),
                    hint: "Missing a category",
                  },
                  {
                    label: "Broken",
                    value: numberFormatter.format(brokenCount),
                    hint: "Linked to removed categories",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="slate"
          eyebrow="State Mix"
          title="Catalog state distribution"
          subtitle="Published, draft, and metadata gaps across the catalog."
        >
          {stateMix.length === 0 ? (
            <EmptyPlot message="State mix becomes available when products exist." />
          ) : (
            <>
              <ChartShell>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stateMix}
                    margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => truncateLabel(String(value), 10)}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {stateMix.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Largest block",
                    value: dominantState?.name ?? "Unknown",
                    hint: `${numberFormatter.format(dominantState?.value ?? 0)} products`,
                  },
                  {
                    label: "States tracked",
                    value: numberFormatter.format(stateMix.length),
                    hint: "Operational conditions monitored",
                  },
                ]}
              />
            </>
          )}
        </Panel>
      </section>
    );
  }

  if (activeTab === "structure") {
    return (
      <section className={styles.grid}>
        <Panel
          tone="gold"
          eyebrow="Taxonomy"
          title="Category mix"
          subtitle="Distribution across mapped categories."
          wide
        >
          {categoryMix.length === 0 ? (
            <EmptyPlot message="Add category assignments to unlock category analysis." />
          ) : (
            <>
              <ChartShell className={styles.chartShellTall}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={categoryMix}
                    margin={{ top: 6, right: 16, left: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => truncateLabel(String(value), 12)}
                    />
                    <YAxis
                      yAxisId="count"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="value"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value, name) =>
                            name === "Value"
                              ? formatCurrency(value)
                              : numberFormatter.format(value)
                          }
                        />
                      }
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="count"
                      name="Products"
                      radius={[12, 12, 0, 0]}
                      fill="#2563eb"
                    />
                    <Line
                      yAxisId="value"
                      type="monotone"
                      dataKey="value"
                      name="Value"
                      stroke="#0f172a"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Lead category",
                    value: leadingCategory?.name ?? "Unknown",
                    hint: `${numberFormatter.format(leadingCategory?.count ?? 0)} products`,
                  },
                  {
                    label: "Mapped groups",
                    value: numberFormatter.format(
                      categoryMix.filter((entry) => entry.name !== "Unmapped").length
                    ),
                    hint: "Active categories in the chart",
                  },
                  {
                    label: "Unmapped",
                    value: numberFormatter.format(unmappedCount),
                    hint: "Products outside category structure",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="plum"
          eyebrow="Tags"
          title="Tag adoption"
          subtitle="Most-used tags across the current catalog."
        >
          {tagUsage.length === 0 ? (
            <EmptyPlot message="Start tagging products to see tag adoption here." />
          ) : (
            <>
              <ChartShell>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tagUsage.slice(0, 6)}
                    margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => truncateLabel(String(value), 12)}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                    <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="#7c3aed" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Top tag",
                    value: topTag?.name ?? "Unknown",
                    hint: `${numberFormatter.format(topTag?.count ?? 0)} linked products`,
                  },
                  {
                    label: "Active tags",
                    value: numberFormatter.format(tagUsage.length),
                    hint: "Tags currently in use",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="slate"
          eyebrow="Quality"
          title="Catalog readiness"
          subtitle="Scored on media, description, category, pricing, and tags or variants."
        >
          {qualityBreakdown.length === 0 ? (
            <EmptyPlot message="Quality scoring becomes available as products are added." />
          ) : (
            <>
              <ChartShell>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={qualityBreakdown}
                    margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {qualityBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Largest block",
                    value: qualityLeader?.name ?? "Unknown",
                    hint: `${numberFormatter.format(qualityLeader?.value ?? 0)} products`,
                  },
                  {
                    label: "States scored",
                    value: numberFormatter.format(qualityBreakdown.length),
                    hint: "Quality bands currently populated",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="gold"
          eyebrow="Mapping"
          title="Category mapping health"
          subtitle="Mapped, unassigned, and broken taxonomy connections."
        >
          {mappingHealth.length === 0 ? (
            <EmptyPlot message="Category mapping data is not available yet." />
          ) : (
            <>
              <ChartShell>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mappingHealth}
                    layout="vertical"
                    margin={{ top: 6, right: 8, left: 12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                      {mappingHealth.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === "Mapped"
                              ? "#2563eb"
                              : entry.name === "Broken"
                                ? "#ef4444"
                                : "#14b8a6"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Mapped",
                    value: numberFormatter.format(mappedCount),
                    hint: "Linked cleanly",
                  },
                  {
                    label: "Unassigned",
                    value: numberFormatter.format(unmappedCount),
                    hint: "Waiting for taxonomy",
                  },
                  {
                    label: "Broken",
                    value: numberFormatter.format(brokenCount),
                    hint: "Needs repair",
                  },
                ]}
              />
            </>
          )}
        </Panel>

        <Panel
          tone="rose"
          eyebrow="State Mix"
          title="Readiness state mix"
          subtitle="Published, draft, and metadata gaps across the current catalog."
        >
          {stateMix.length === 0 ? (
            <EmptyPlot message="State mix becomes available when products exist." />
          ) : (
            <>
              <ChartShell>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stateMix}
                    margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => truncateLabel(String(value), 10)}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={
                        <ChartTooltip
                          valueFormatter={(value) => numberFormatter.format(value)}
                        />
                      }
                    />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {stateMix.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
              <MetricGrid
                items={[
                  {
                    label: "Largest block",
                    value: dominantState?.name ?? "Unknown",
                    hint: `${numberFormatter.format(dominantState?.value ?? 0)} products`,
                  },
                  {
                    label: "States tracked",
                    value: numberFormatter.format(stateMix.length),
                    hint: "Operational conditions monitored",
                  },
                ]}
              />
            </>
          )}
        </Panel>
      </section>
    );
  }

  return (
    <section className={styles.grid}>
      <Panel
        tone="slate"
        eyebrow="Merchandising"
        title="Top value products"
        subtitle="Highest priced products in the current catalog."
        wide
      >
        {topValueProducts.length === 0 ? (
          <EmptyPlot message="No price data is available yet." />
        ) : (
          <>
            <ChartShell className={styles.chartShellTall}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topValueProducts}
                  layout="vertical"
                  margin={{ top: 6, right: 12, left: 12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={132}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => truncateLabel(String(value), 18)}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(value) => formatCurrency(value)} />
                    }
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
            <MetricGrid
              items={[
                {
                  label: "Lead product",
                  value: topValueLeader?.name ?? "Unknown",
                  hint: "Highest current catalog price",
                },
                {
                  label: "Lead price",
                  value: formatCurrency(topValueLeader?.value ?? 0),
                  hint: "Top-priced product",
                },
                {
                  label: "Average of top set",
                  value: formatCurrency(topValueAverage),
                  hint: "Mean price across visible leaders",
                },
              ]}
            />
          </>
        )}
      </Panel>

      <Panel
        tone="gold"
        eyebrow="Category value"
        title="Value by category"
        subtitle="Highest catalog value concentration by category."
      >
        {categoryMix.length === 0 ? (
          <EmptyPlot message="Assign products to categories to map value concentration." />
        ) : (
          <>
            <ChartShell className={styles.chartShellCompact}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryMix.slice(0, 6)}
                  margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => truncateLabel(String(value), 12)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip valueFormatter={(value) => formatCurrency(value)} />
                    }
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
            <MetricGrid
              items={[
                {
                  label: "Lead category",
                  value: leadingCategory?.name ?? "Unknown",
                  hint: "Largest value concentration",
                },
                {
                  label: "Lead value",
                  value: formatCurrency(leadingCategory?.value ?? 0),
                  hint: "Value held in the top category",
                },
              ]}
            />
          </>
        )}
      </Panel>

      <Panel
        tone="rose"
        eyebrow="Price spread"
        title="Price architecture"
        subtitle="Where the catalog is concentrated right now."
      >
        <>
          <ChartShell>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priceBands}
                margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valueFormatter={(value) => numberFormatter.format(value)}
                    />
                  }
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
          <MetricGrid
            items={[
              {
                label: "Dominant band",
                value: dominantPriceBand?.name ?? "Unknown",
                hint: `${numberFormatter.format(dominantPriceBand?.value ?? 0)} products`,
              },
              {
                label: "Bands tracked",
                value: numberFormatter.format(priceBands.length),
                hint: "Current pricing layers",
              },
            ]}
          />
        </>
      </Panel>

      <Panel
        tone="gold"
        eyebrow="Mapping"
        title="Category mapping health"
        subtitle="Mapped, unassigned, and broken taxonomy connections."
      >
        {mappingHealth.length === 0 ? (
          <EmptyPlot message="Category mapping data is not available yet." />
        ) : (
          <>
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mappingHealth}
                  layout="vertical"
                  margin={{ top: 6, right: 8, left: 12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(value) => numberFormatter.format(value)}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                    {mappingHealth.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === "Mapped"
                            ? "#2563eb"
                            : entry.name === "Broken"
                              ? "#ef4444"
                              : "#14b8a6"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
            <MetricGrid
              items={[
                {
                  label: "Mapped",
                  value: numberFormatter.format(mappedCount),
                  hint: "Linked cleanly",
                },
                {
                  label: "Unassigned",
                  value: numberFormatter.format(unmappedCount),
                  hint: "Waiting for taxonomy",
                },
                {
                  label: "Broken",
                  value: numberFormatter.format(brokenCount),
                  hint: "Needs repair",
                },
              ]}
            />
          </>
        )}
      </Panel>

      <Panel
        tone="slate"
        eyebrow="State mix"
        title="Catalog state distribution"
        subtitle="Published, draft, and metadata gaps across the catalog."
      >
        {stateMix.length === 0 ? (
          <EmptyPlot message="State mix becomes available when products exist." />
        ) : (
          <>
            <ChartShell>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stateMix}
                  margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => truncateLabel(String(value), 10)}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={
                      <ChartTooltip
                        valueFormatter={(value) => numberFormatter.format(value)}
                      />
                    }
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {stateMix.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartShell>
            <MetricGrid
              items={[
                {
                  label: "Largest block",
                  value: dominantState?.name ?? "Unknown",
                  hint: `${numberFormatter.format(dominantState?.value ?? 0)} products`,
                },
                {
                  label: "States tracked",
                  value: numberFormatter.format(stateMix.length),
                  hint: "Operational conditions monitored",
                },
              ]}
            />
          </>
        )}
      </Panel>
    </section>
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
  tone?: "teal" | "orange" | "slate" | "gold" | "plum" | "rose";
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

function ChartShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={[styles.chartShell, className].filter(Boolean).join(" ")}>{children}</div>;
}

function MetricGrid({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: string; hint: string }>;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={[
        styles.metricGrid,
        columns === 3 ? styles.metricGridThree : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((item) => (
        <div key={item.label} className={styles.metricCard}>
          <span className={styles.metricCardLabel}>{item.label}</span>
          <strong className={styles.metricCardValue}>{item.value}</strong>
          <span className={styles.metricCardHint}>{item.hint}</span>
        </div>
      ))}
    </div>
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

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (value) => numberFormatter.format(value),
}: TooltipProps<number, string> & {
  valueFormatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={styles.chartTooltip}>
      {label ? <p className={styles.chartTooltipLabel}>{String(label)}</p> : null}
      <div className={styles.chartTooltipList}>
        {payload.map((entry) => {
          const numericValue =
            typeof entry.value === "number"
              ? entry.value
              : Number(entry.value ?? 0);

          return (
            <div
              key={`${entry.dataKey}-${entry.name}`}
              className={styles.chartTooltipItem}
            >
              <span
                className={styles.chartTooltipSwatch}
                style={{ backgroundColor: entry.color ?? "#2563eb" }}
              />
              <span className={styles.chartTooltipKey}>{entry.name}</span>
              <strong className={styles.chartTooltipValue}>
                {valueFormatter(numericValue, String(entry.name ?? entry.dataKey ?? ""))}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
