import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./admin.css";
import AdminLayoutClient from "./AdminLayoutClient";

const adminSans = Inter({
  subsets: ["latin"],
  variable: "--font-admin-sans",
});

const adminDisplay = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-admin-display",
});

export const metadata: Metadata = {
  title: {
    default: "Rani Riwaaj Admin",
    template: "%s | Rani Riwaaj Admin",
  },
  description: "Admin command center for Rani Riwaaj.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${adminSans.variable} ${adminDisplay.variable}`}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </div>
  );
}
