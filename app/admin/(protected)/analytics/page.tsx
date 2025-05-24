// app/admin/(protected)/analytics/ClientAnalytics.tsx
// Client component – all Recharts logic & dummy data lives here

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
import styles from "./analytics.module.css";

interface Props {
  baseStats: { productCount: number; categoryCount: number };
}

export default function ClientAnalytics({ baseStats }: Props) {
  // ── Dummy data (swap for live API data later) ────────────────────────────
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
    revenueGrowth: 5.8, // vs previous period
    dailyActiveUsers: 840,
  };

  const COLORS = ["#007EA7", "#003459", "#FCA311", "#E5E5E5", "#00171F"];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.chartsGrid}>
      {/* 1️⃣/2️⃣  Sales vs Orders (combo line chart) */}
      <Card title="7-Day Sales vs Orders" span>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={dailySales}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="sales"
              name="Sales (₹)"
              stroke="#007EA7"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#FCA311"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 3️⃣  Revenue share (pie chart) */}
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
                <Cell
                  key={`cell-${idx}`}
                  fill={COLORS[idx % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* 4️⃣  Top products (horizontal bar) */}
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

      {/* 5️⃣  Revenue growth (radar) */}
      <Card title="Monthly Revenue Growth (Goal vs Actual)">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart
            outerRadius={90}
            data={[{ month: "May", growth: kpi.revenueGrowth, goal: 8 }]}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="month" />
            <Radar
              name="Actual"
              dataKey="growth"
              stroke="#007EA7"
              fill="#007EA7"
              fillOpacity={0.6}
            />
            <Radar
              name="Goal"
              dataKey="goal"
              stroke="#FCA311"
              fill="#FCA311"
              fillOpacity={0.3}
            />
            <Legend />
            <Tooltip formatter={(v: number) => `${v}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* 6️⃣  Geo sales (treemap) */}
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

      {/* 7️⃣-1️⃣5️⃣  KPI mini-cards */}
      <MiniStat
        label="Avg Order Value"
        value={`₹${kpi.avgOrderValue.toLocaleString()}`}
      />
      <MiniStat label="Conversion Rate" value={`${kpi.conversionRate}%`} />
      <MiniStat label="Refund Rate" value={`${kpi.refundRate}%`} />
      <MiniStat
        label="Returning Customers"
        value={`${kpi.returningCustomerRate}%`}
      />
      <MiniStat
        label="Cart Abandonment"
        value={`${kpi.cartAbandonmentRate}%`}
      />
      <MiniStat label="Low Stock Items" value={kpi.lowStockItems} />
      <MiniStat label="Daily Active Users" value={kpi.dailyActiveUsers} />
      <MiniStat label="Products (live)" value={baseStats.productCount} />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
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
