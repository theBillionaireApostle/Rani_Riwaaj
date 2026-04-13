import type { ReactNode } from "react";

export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
