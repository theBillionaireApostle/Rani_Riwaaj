// app/admin/(protected)/analytics/ClientAnalytics.tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import styles from "./analytics.module.css";

interface AnalyticsCounts {
  productCount: number;
  categoryCount: number;
}

interface Props {
  /** server‐rendered fallback counts */
  baseStats?: AnalyticsCounts;
}

export default function ClientAnalytics({ baseStats }: Props) {
  //───────────────────────────────────────────
  // 1️⃣ Live product & category counts
  //───────────────────────────────────────────
  const [counts, setCounts] = useState<AnalyticsCounts>({
    productCount: baseStats?.productCount ?? 0,
    categoryCount: baseStats?.categoryCount ?? 0,
  });

  useEffect(() => {
    const base = "https://rani-riwaaj-backend-ylbq.vercel.app";
    Promise.all([
      fetch(`${base}/api/products`,   { cache: "no-store" }),
      fetch(`${base}/api/categories`, { cache: "no-store" }),
    ])
      .then(async ([prodRes, catRes]) => {
        if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch analytics");
        const [products, categories] = await Promise.all([prodRes.json(), catRes.json()]);
        setCounts({
          productCount: Array.isArray(products)   ? products.length   : 0,
          categoryCount: Array.isArray(categories) ? categories.length : 0,
        });
      })
      .catch((err) => console.error("Analytics fetch failed:", err));
  }, []);

  //───────────────────────────────────────────
  // 2️⃣ Dummy chart data
  //───────────────────────────────────────────
  const dailySales = [
    { date: "18 May", sales: 12000, orders: 80 },
    { date: "19 May", sales: 13400, orders: 91 },
    { date: "20 May", sales: 14250, orders: 95 },
    { date: "21 May", sales: 12600, orders: 82 },
    { date: "22 May", sales: 15120, orders: 102 },
    { date: "23 May", sales: 15840, orders: 106 },
    { date: "24 May", sales: 16600, orders: 111 },
  ];
  const revenueByCategory = [
    { name: "Sarees", value: 78000 },
    { name: "Lehengas", value: 42000 },
    { name: "Kurtis", value: 32000 },
    { name: "Dupattas", value: 15000 },
    { name: "Accessories", value: 11000 },
  ];
  const topProducts = [
    { name: "Red Banarasi", sales: 8500 },
    { name: "Pink Patola", sales: 7300 },
    { name: "Gold Kanjivaram", sales: 6900 },
    { name: "Green Chiffon", sales: 6400 },
    { name: "Blue Bandhani", sales: 6100 },
  ];

  //───────────────────────────────────────────
  // 3️⃣ Derived summary values
  //───────────────────────────────────────────
  const totalRevenue = dailySales.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders  = dailySales.reduce((sum, d) => sum + d.orders, 0);

  //───────────────────────────────────────────
  // 4️⃣ Render
  //───────────────────────────────────────────
  return (
    <>
      {/* Summary tiles */}
      <div className={styles.statsGrid}>
        <SummaryCard label="7-Day Revenue"    value={`₹${totalRevenue.toLocaleString()}`} />
        <SummaryCard label="7-Day Orders"     value={totalOrders} />
        <SummaryCard label="Products (live)"  value={counts.productCount} />
        <SummaryCard label="Categories (live)"value={counts.categoryCount} />
      </div>

      {/* Core charts */}
      <div className={styles.chartsGrid}>
        {/* Sales vs Orders */}
        <ChartCard title="7-Day Sales vs Orders" span>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailySales} margin={{ top: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Line dataKey="sales" name="Sales (₹)" stroke="#007EA7" strokeWidth={2} />
              <Line dataKey="orders" name="Orders"     stroke="#FCA311" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue share */}
        <ChartCard title="Revenue by Category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                dataKey="value"
                data={revenueByCategory}
                cx="50%" cy="50%"
                outerRadius={90}
                label={({ name }) => name}
              >
                {revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={["#007EA7","#003459","#FCA311","#E5E5E5","#00171F"][i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top products */}
        <ChartCard title="Top 5 Products by Sales">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={140} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="sales" fill="#003459" radius={[0,8,8,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}

// ──────────────────────────────────────────
// Minor reusable components
// ──────────────────────────────────────────
function SummaryCard({ label, value }: { label: string; value: number|string }) {
  return (
    <div className={styles.statCard}>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

function ChartCard({
  title, children, span
}: {
  title: string; children: React.ReactNode; span?: boolean;
}) {
  return (
    <div className={span ? styles.cardSpan : styles.card}>
      <h4 className={styles.cardTitle}>{title}</h4>
      {children}
    </div>
  );
}
