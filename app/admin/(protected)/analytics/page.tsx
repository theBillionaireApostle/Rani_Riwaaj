// -----------------------------------------------------------------------------
// 📊  Rani Riwaj – Analytics Dashboard (Admin)
// -----------------------------------------------------------------------------
// Location : app/admin/(protected)/analytics/
// Files    :
//   • page.tsx              – Server‑side wrapper (retains metadata + SSR fetch)
//   • ClientAnalytics.tsx   – Fully client component with Recharts visualisations
//   • analytics.module.css  – Lightweight, modern styling
// -----------------------------------------------------------------------------

// =====================================================
// 1️⃣  page.tsx – Server component (metadata friendly)
// =====================================================
// app/admin/(protected)/analytics/page.tsx

import { Metadata } from "next"
import dynamic       from "next/dynamic"
import styles        from "./analytics.module.css"

export const metadata: Metadata = {
  title:       "Analytics | Rani Riwaj Admin",
  description: "Beautiful, insight‑driven dashboard for your Rani Riwaj store",
}

// ──────────────────────────────────────────────────────────────────────────────
// Fallback counts – always show *something* even if remote fetch fails
// ──────────────────────────────────────────────────────────────────────────────
async function getBaseStats() {
  const base = process.env.BACKEND_URL || "https://rani-riwaaj-backend-ylbq.vercel.app";
  try {
    const [prodRes, catRes] = await Promise.all([
      fetch(`${base}/api/products`,   { cache: "no-store" }),
      fetch(`${base}/api/categories`, { cache: "no-store" }),
    ]);
    if (!prodRes.ok || !catRes.ok) throw new Error("Bad response");
    const [products, categories] = await Promise.all([prodRes.json(), catRes.json()]);
    return {
      productCount:   Array.isArray(products)   ? products.length   : 0,
      categoryCount:  Array.isArray(categories) ? categories.length : 0,
    };
  } catch (_) {
    return { productCount: 0, categoryCount: 0 }; // graceful degradation
  }
}

// Client‑side charts (Recharts doesn’t support SSR)
const ClientAnalytics = dynamic(() => import("./ClientAnalytics"), {
  ssr: false,
  loading: () => <p className={styles.loading}>Loading interactive analytics…</p>,
});

export default async function AnalyticsPage() {
  const baseStats = await getBaseStats();

  return (
    <section className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Analytics</h1>

      {/* High‑level widgets — always visible, even if JS fails */}
      <div className={styles.statsGrid}>
        <StatCard label="Total Products"   value={baseStats.productCount} />
        <StatCard label="Total Categories" value={baseStats.categoryCount} />
      </div>

      {/* Rich, client‑only analytics */}
      <ClientAnalytics baseStats={baseStats} />
    </section>
  );
}

// 💡 Reusable tiny stat card (server safe)
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.statCard}>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

// =====================================================
// 2️⃣  ClientAnalytics.tsx – Recharts & interactivity
// =====================================================
// app/admin/(protected)/analytics/ClientAnalytics.tsx

"use client";

import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  Tooltip, Legend, CartesianGrid, XAxis, YAxis,
  Treemap,
} from "recharts";
import styles from "./analytics.module.css";

interface Props {
  baseStats: { productCount: number; categoryCount: number };
}

export default function ClientAnalytics({ baseStats }: Props) {
  // ── ✨  Dummy (placeholder) data – replace with real API later ─────────────
  const dailySales = [
    { date: "18 May", sales: 12000, orders: 80 },
    { date: "19 May", sales: 13400, orders: 91 },
    { date: "20 May", sales: 14250, orders: 95 },
    { date: "21 May", sales: 12600, orders: 82 },
    { date: "22 May", sales: 15120, orders: 102 },
    { date: "23 May", sales: 15840, orders: 106 },
    { date: "24 May", sales: 16600, orders: 111 },
  ];

  const revenueByCategory = [
    { name: "Sarees",     value: 78000 },
    { name: "Lehengas",  value: 42000 },
    { name: "Kurtis",     value: 32000 },
    { name: "Dupattas",   value: 15000 },
    { name: "Accessories",value: 11000 },
  ];

  const topProducts = [
    { name: "Red Banarasi",   sales: 8500 },
    { name: "Pink Patola",    sales: 7300 },
    { name: "Gold Kanjivaram",sales: 6900 },
    { name: "Green Chiffon",  sales: 6400 },
    { name: "Blue Bandhani",  sales: 6100 },
  ];

  const geoSales = [
    { name: "Delhi",          size: 27000 },
    { name: "Mumbai",         size: 23000 },
    { name: "Bengaluru",      size: 18000 },
    { name: "Kolkata",        size: 15000 },
    { name: "Hyderabad",      size: 12000 },
  ];

  const kpi = {
    avgOrderValue:          1475,
    conversionRate:         3.4,    // %
    refundRate:             0.6,    // %
    returningCustomerRate:  27.9,   // %
    cartAbandonmentRate:    67.2,   // %
    lowStockItems:          14,
    revenueGrowth:          5.8,    // % vs previous period
    dailyActiveUsers:       840,
  };

  // Palette (aligns to brand colours)
  const COLORS = ["#007EA7", "#003459", "#FCA311", "#E5E5E5", "#00171F"];

  return (
    <div className={styles.chartsGrid}>
      {/* 1️⃣/2️⃣  Sales & Orders – combo chart */}
      <Card title="7‑Day Sales vs Orders" span>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailySales} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="sales"   name="Sales (₹)"  stroke="#007EA7" strokeWidth={2} />
            <Line type="monotone" dataKey="orders"  name="Orders"      stroke="#FCA311" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 3️⃣  Revenue by Category – pie */}
      <Card title="Revenue by Category">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              dataKey="value"
              data={revenueByCategory}
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name }) => name}
            >
              {revenueByCategory.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* 4️⃣  Top‑selling Products – bar */}
      <Card title="Top 5 Products by Sales">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topProducts} layout="vertical" margin={{ left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={140} />
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            <Bar dataKey="sales" fill="#003459" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 5️⃣  Revenue Growth – radar */}
      <Card title="Monthly Revenue Growth (Goal vs Actual)">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart outerRadius={90} data={[{ month: "May", growth: kpi.revenueGrowth, goal: 8 }]}> 
            <PolarGrid />
            <PolarAngleAxis dataKey="month" />
            <Radar name="Actual" dataKey="growth" stroke="#007EA7" fill="#007EA7" fillOpacity={0.6} />
            <Radar name="Goal"  dataKey="goal"   stroke="#FCA311" fill="#FCA311" fillOpacity={0.3} />
            <Legend />
            <Tooltip formatter={(v: number) => `${v}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* 6️⃣  Geographic Sales – treemap */}
      <Card title="Sales by Metro City">
        <ResponsiveContainer width="100%" height={260}>
          <Treemap
            data={geoSales}
            dataKey="size"
            nameKey="name"
            stroke="#fff"
            fill="#003459"
            ratio={4 / 3}
          />
        </ResponsiveContainer>
      </Card>

      {/* 7️⃣‑1️⃣5️⃣  KPI mini‑cards (8 items) */}
      <MiniStat label="Avg Order Value"        value={`₹${kpi.avgOrderValue.toLocaleString()}`} />
      <MiniStat label="Conversion Rate"        value={`${kpi.conversionRate}%`}              />
      <MiniStat label="Refund Rate"            value={`${kpi.refundRate}%`}                 />
      <MiniStat label="Returning Customers"    value={`${kpi.returningCustomerRate}%`}      />
      <MiniStat label="Cart Abandonment"       value={`${kpi.cartAbandonmentRate}%`}        />
      <MiniStat label="Low Stock Items"        value={kpi.lowStockItems}                    />
      <MiniStat label="Daily Active Users"     value={kpi.dailyActiveUsers}                 />
      <MiniStat label="Products (live)"        value={baseStats.productCount}               />
    </div>
  );
}

// ── 💎  Small helpers ────────────────────────────────────────────────────────
function Card({ title, children, span }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? styles.cardSpan : styles.card}>
      <h4 className={styles.cardTitle}>{title}</h4>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.miniStat}>
      <span className={styles.miniLabel}>{label}</span>
      <span className={styles.miniValue}>{value}</span>
    </div>
  );
}

// =====================================================
// 3️⃣  analytics.module.css – refined elegance
// =====================================================
// app/admin/(protected)/analytics/analytics.module.css

.wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem 1rem;
}

.pageTitle {
  font-size: 2rem;
  font-weight: 700;
  color: var(--prussian);
  text-align: center;
}

.loading {
  text-align: center;
  padding: 4rem 0;
  font-weight: 500;
}

/* High‑level stat cards */
.statsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.statCard {
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  text-align: center;
}

/* Chart grid (auto‑flow dense for Masonry‑like fill) */
.chartsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  grid-auto-rows: 340px;
  gap: 1.5rem;
  grid-auto-flow: dense;
}

.card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.25rem 1rem 0.5rem;
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
}

.cardSpan {
  composes: card;
  grid-column: span 2;
}

.cardTitle {
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--cerulean);
  text-align: center;
}

/* Mini KPI cards */
.miniStat {
  background: #f7f9fa;
  border-radius: 0.875rem;
  padding: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.miniLabel {
  font-size: 0.8rem;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.miniValue {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--rich-black);
}

@media (prefers-color-scheme: dark) {
  .card, .statCard, .miniStat { background: #0b1c24; box-shadow: 0 4px 14px rgba(0,0,0,0.4); }
  .pageTitle, .cardTitle, .miniValue { color: #ffffff; }
  .miniLabel { color: #9ca3af; }
}

/* Let Recharts take the full card width */
.card :global(svg) {
  width: 100% !important;
}
