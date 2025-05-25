// app/admin/(protected)/analytics/ClientAnalytics.tsx
// Client component – summary + visual charts – now fetches live counts

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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  Treemap,
} from "recharts";
import { useEffect, useState } from "react";
import styles from "./analytics.module.css";

interface AnalyticsCounts {
  productCount: number;
  categoryCount: number;
}

interface Props {
  /** fallback values from the server; will be updated on the client */
  baseStats?: AnalyticsCounts;
}

export default function ClientAnalytics({ baseStats }: Props) {
  /* ─────────── 1. Live counts (fetch from /api/analytics) ─────────────── */
  const [counts, setCounts] = useState<AnalyticsCounts>({
    productCount: baseStats?.productCount ?? 0,
    categoryCount: baseStats?.categoryCount ?? 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch("https://rani-riwaaj-backend-ylbq.vercel.app/api/analytics", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json: AnalyticsCounts) => {
        setCounts({
          productCount: json.productCount ?? 0,
          categoryCount: json.categoryCount ?? 0,
        });
      })
      .catch((err) => console.error("analytics fetch failed", err));
  }, []);

  /* ─────────── 2. Dummy datasets for charts ───────────────────────────── */
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

  const geoSales = [
    { name: "Delhi", size: 27000 },
    { name: "Mumbai", size: 23000 },
    { name: "Bengaluru", size: 18000 },
    { name: "Kolkata", size: 15000 },
    { name: "Hyderabad", size: 12000 },
  ];

  const kpi = {
    avgOrderValue: 1475,
    conversionRate: 3.4,
    refundRate: 0.6,
    returningCustomerRate: 27.9,
    cartAbandonmentRate: 67.2,
    lowStockItems: 14,
    revenueGrowth: 5.8,
    dailyActiveUsers: 840,
  };

  const COLORS = ["#007EA7", "#003459", "#FCA311", "#E5E5E5", "#00171F"];

  /* ─────────── 3. Derived summary numbers ─────────────────────────────── */
  const totalRevenue = dailySales.reduce((acc, d) => acc + d.sales, 0);
  const totalOrders = dailySales.reduce((acc, d) => acc + d.orders, 0);

  /* ─────────── 4. Render ──────────────────────────────────────────────── */
  return (
    <>
      {/* ===== Summary cards on top ==================================== */}
      <div className={styles.statsGrid}>
        <SummaryCard
          label="7-Day Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
        />
        <SummaryCard label="7-Day Orders" value={totalOrders} />
        <SummaryCard
          label="Avg Order Value"
          value={`₹${kpi.avgOrderValue.toLocaleString()}`}
        />
        <SummaryCard label="Products (live)" value={counts.productCount} />
        <SummaryCard label="Categories (live)" value={counts.categoryCount} />
      </div>

      {/* ===== Charts grid ============================================ */}
      <div className={styles.chartsGrid}>
        {/* 1️⃣ Sales vs Orders */}
        <Card title="7-Day Sales vs Orders" span>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dailySales} margin={{ top: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Line
                dataKey="sales"
                name="Sales (₹)"
                stroke="#007EA7"
                strokeWidth={2}
              />
              <Line
                dataKey="orders"
                name="Orders"
                stroke="#FCA311"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 2️⃣ Revenue by Category (pie) */}
        <Card title="Revenue by Category">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                dataKey="value"
                data={revenueByCategory}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(d) => d.name}
              >
                {revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* 3️⃣ Top Products (horizontal bar) */}
        <Card title="Top 5 Products by Sales">
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

        {/* 4️⃣ Revenue Growth (radar) */}
        <Card title="Monthly Revenue Growth vs Goal">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart
              outerRadius={90}
              data={[{ m: "May", g: kpi.revenueGrowth, goal: 8 }]}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="m" />
              <Radar
                dataKey="g"
                name="Actual"
                stroke="#007EA7"
                fill="#007EA7"
                fillOpacity={0.6}
              />
              <Radar
                dataKey="goal"
                name="Goal"
                stroke="#FCA311"
                fill="#FCA311"
                fillOpacity={0.3}
              />
              <Legend />
              <Tooltip formatter={(v: number) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* 5️⃣ Geo Treemap */}
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

        {/* 6️⃣-10️⃣ KPI tiles */}
        <MiniStat
          label="Conversion Rate"
          value={`${kpi.conversionRate}%`}
        />
        <MiniStat label="Refund Rate" value={`${kpi.refundRate}%`} />
        <MiniStat
          label="Cart Abandonment"
          value={`${kpi.cartAbandonmentRate}%`}
        />
        <MiniStat
          label="Returning Customers"
          value={`${kpi.returningCustomerRate}%`}
        />
        <MiniStat
          label="Daily Active Users"
          value={kpi.dailyActiveUsers}
        />
      </div>
    </>
  );
}

/* ───────────────────────── Reusable components ────────────────────────── */
function Card({
  title,
  children,
  span,
}: {
  title: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div className={span ? styles.cardSpan : styles.card}>
      <h4 className={styles.cardTitle}>{title}</h4>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.statCard}>
      <h3>{label}</h3>
      <p>{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.miniStat}>
      <span className={styles.miniLabel}>{label}</span>
      <span className={styles.miniValue}>{value}</span>
    </div>
  );
}
