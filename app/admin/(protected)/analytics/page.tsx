// app/admin/(protected)/analytics/ClientAnalytics.tsx
// Client component – now adds micro-charts for each KPI so the panel is fully visual

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
  RadialBarChart,
  RadialBar,
} from "recharts";
import styles from "./analytics.module.css";

interface Props {
  baseStats?: { productCount: number; categoryCount: number };
}

export default function ClientAnalytics({ baseStats }: Props) {
  /* ─────────── Dummy data (keep) ───────────────────────────────────────── */
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

  /* Live counts */
  const totalProducts = baseStats?.productCount ?? 0;
  const totalCategories = baseStats?.categoryCount ?? 0;

  /* ─────────── KPI micro-chart builders ────────────────────────────────── */
  const donutData = (value: number) => [
    { name: "value", value },
    { name: "rest", value: 100 - value },
  ];

  const ringStyle = {
    trackStroke: "#E5E5E5",
    fill: "#007EA7",
  };

  /* ─────────── Render ──────────────────────────────────────────────────── */
  return (
    <div className={styles.chartsGrid}>
      {/* 1️⃣  Sales vs Orders */}
      <Card title="7-Day Sales vs Orders" span>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={dailySales} margin={{ top: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#007EA7" strokeWidth={2} name="Sales (₹)" />
            <Line type="monotone" dataKey="orders" stroke="#FCA311" strokeWidth={2} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* 2️⃣  Revenue share */}
      <Card title="Revenue by Category">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie dataKey="value" data={revenueByCategory} cx="50%" cy="50%" outerRadius={90} label={(d) => d.name}>
              {revenueByCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* 3️⃣  Top products */}
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

      {/* 4️⃣  Revenue growth */}
      <Card title="Monthly Revenue Growth vs Goal">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart outerRadius={90} data={[{ m: "May", g: kpi.revenueGrowth, goal: 8 }]}>
            <PolarGrid />
            <PolarAngleAxis dataKey="m" />
            <Radar dataKey="g" name="Actual" stroke="#007EA7" fill="#007EA7" fillOpacity={0.6} />
            <Radar dataKey="goal" name="Goal" stroke="#FCA311" fill="#FCA311" fillOpacity={0.3} />
            <Legend />
            <Tooltip formatter={(v: number) => `${v}%`} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>

      {/* 5️⃣  Geo treemap */}
      <Card title="Sales by Metro City">
        <ResponsiveContainer width="100%" height={260}>
          <Treemap data={geoSales} dataKey="size" nameKey="name" stroke="#fff" fill="#003459" ratio={4/3} />
        </ResponsiveContainer>
      </Card>

      {/* 6️⃣-9️⃣  KPI donut rings */}
      <KpiDonut label="Conversion Rate" value={kpi.conversionRate} color="#007EA7" />
      <KpiDonut label="Refund Rate"     value={kpi.refundRate}     color="#FCA311" />
      <KpiDonut label="Cart Abandonment" value={kpi.cartAbandonmentRate} color="#003459" />
      <KpiDonut label="Returning Cust." value={kpi.returningCustomerRate} color="#00171F" />

      {/* 10️⃣  Avg Order Value (mini area) */}
      <Card title="Avg Order Value (₹)" >
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={[{ x: 0, y: 0 }, { x: 1, y: kpi.avgOrderValue }]}>
            <Line type="monotone" dataKey="y" stroke="#007EA7" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className={styles.kpiValue}>₹{kpi.avgOrderValue.toLocaleString()}</p>
      </Card>

      {/* 11️⃣  Daily Users (radial) */}
      <KpiDonut label="Daily Active Users" value={Math.min(kpi.dailyActiveUsers / 10, 100)} unit="% of cap" color="#F35" />

      {/* 12️⃣-13️⃣  Live counts */}
      <KpiNumeric label="Products (live)" value={totalProducts} />
      <KpiNumeric label="Categories (live)" value={totalCategories} />
    </div>
  );
}

/* ───────────────────────── Helpers ─────────────────────────────────────── */
function Card({ title, children, span }: { title: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={span ? styles.cardSpan : styles.card}>
      <h4 className={styles.cardTitle}>{title}</h4>
      {children}
    </div>
  );
}

function KpiNumeric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.miniStat}>
      <span className={styles.miniLabel}>{label}</span>
      <span className={styles.miniValue}>{value}</span>
    </div>
  );
}

function KpiDonut({ label, value, unit = "%", color }: { label: string; value: number; unit?: string; color: string }) {
  const data = [
    { name: "value", value },
    { name: "rest", value: 100 - value },
  ];
  return (
    <div className={styles.miniStat}>
      <ResponsiveContainer width="100%" height={90}>
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" cornerRadius={50} fill={color} clockWise />
        </RadialBarChart>
      </ResponsiveContainer>
      <span className={styles.miniValue}>{value}{unit}</span>
      <span className={styles.miniLabel}>{label}</span>
    </div>
  );
}
