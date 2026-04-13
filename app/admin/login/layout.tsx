// app/admin/login/layout.tsx

import { ReactNode } from "react";

export const metadata = {
  title: "Admin Login | Rani Riwaaj",
  description: "Login to access the admin panel.",
};

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  // We no longer render <html> or <body> here—those are in app/layout.tsx
  return <>{children}</>;
}
