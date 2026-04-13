import type { ReactNode } from "react";

interface ProtectedSidebarProps {
  children: ReactNode;
}

// Legacy compatibility wrapper. The active admin shell now lives in /app/admin/AdminLayoutClient.tsx.
export default function ProtectedSidebar({
  children,
}: ProtectedSidebarProps) {
  return <>{children}</>;
}
