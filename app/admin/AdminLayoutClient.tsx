"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Clock3,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package2,
  Plus,
  Settings2,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";
import {
  type ReactNode,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AdminLayoutClientProps {
  children: ReactNode;
}

interface AdminIdentity {
  expiresAt: number | null;
  name: string;
  role: string;
}

type PageMeta = {
  description: string;
  label: string;
  kicker: string;
};

type TokenPayload = {
  email?: string;
  exp?: number;
  name?: string;
  role?: string;
  sub?: string;
  username?: string;
};

const PAGE_META: Array<{
  test: (pathname: string) => boolean;
  value: PageMeta;
}> = [
  {
    test: (pathname) => pathname === "/admin",
    value: {
      kicker: "Overview",
      label: "Dashboard",
      description: "Live catalog status, publish control, and action items.",
    },
  },
  {
    test: (pathname) => pathname === "/admin/products",
    value: {
      kicker: "Catalog",
      label: "Products",
      description: "Product list, status, and direct edit access.",
    },
  },
  {
    test: (pathname) => pathname === "/admin/products/create",
    value: {
      kicker: "Catalog",
      label: "New Product",
      description: "Create a new product with live backend data.",
    },
  },
  {
    test: (pathname) => pathname.includes("/admin/products/") && pathname.endsWith("/edit"),
    value: {
      kicker: "Catalog",
      label: "Edit Product",
      description: "Update media, details, and publish state.",
    },
  },
  {
    test: (pathname) => pathname === "/admin/analytics",
    value: {
      kicker: "Signals",
      label: "Analytics",
      description: "Catalog health, coverage, and readiness signals.",
    },
  },
  {
    test: (pathname) => pathname === "/admin/categories",
    value: {
      kicker: "Structure",
      label: "Categories",
      description: "Category structure and mapped product coverage.",
    },
  },
  {
    test: (pathname) => pathname === "/admin/tags",
    value: {
      kicker: "Structure",
      label: "Tags",
      description: "Tag taxonomy and grouping controls.",
    },
  },
  {
    test: (pathname) => pathname === "/admin/settings",
    value: {
      kicker: "Security",
      label: "Settings",
      description: "Admin access and security controls.",
    },
  },
];

const NAV_ITEMS = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    matcher: (pathname: string) => pathname === "/admin",
  },
  {
    href: "/admin/products",
    icon: Package2,
    label: "Products",
    matcher: (pathname: string) => pathname.startsWith("/admin/products"),
  },
  {
    href: "/admin/analytics",
    icon: BarChart3,
    label: "Analytics",
    matcher: (pathname: string) => pathname === "/admin/analytics",
  },
  {
    href: "/admin/categories",
    icon: FolderTree,
    label: "Categories",
    matcher: (pathname: string) => pathname === "/admin/categories",
  },
  {
    href: "/admin/tags",
    icon: Tags,
    label: "Tags",
    matcher: (pathname: string) => pathname === "/admin/tags",
  },
  {
    href: "/admin/settings",
    icon: Settings2,
    label: "Settings",
    matcher: (pathname: string) => pathname === "/admin/settings",
  },
];

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function decodeToken(token: string): AdminIdentity {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid admin session.");
  }

  const payload = JSON.parse(
    atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
  ) as TokenPayload;

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error("Your admin session has expired.");
  }

  const rawName =
    payload.name ??
    payload.username ??
    payload.email?.split("@")[0] ??
    payload.sub ??
    "Admin";

  return {
    expiresAt: payload.exp ? payload.exp * 1000 : null,
    name: titleCase(rawName),
    role: titleCase(payload.role ?? "Admin"),
  };
}

function clearAdminSession() {
  localStorage.removeItem("admin_jwt");
  document.cookie =
    "admin_jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

function formatNow(now: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    weekday: "short",
  }).format(new Date(now));
}

function getSessionLabel(expiresAt: number | null): string {
  if (!expiresAt) return "Session active";
  const msLeft = expiresAt - Date.now();
  if (msLeft <= 0) return "Session expired";
  if (msLeft <= 30 * 60 * 1000) return "Session expiring soon";
  return "Session active";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "A";
}

function getPageMeta(pathname: string): PageMeta {
  return (
    PAGE_META.find((entry) => entry.test(pathname))?.value ?? {
      kicker: "Admin",
      label: "Workspace",
      description: "Operational admin workspace.",
    }
  );
}

export default function AdminLayoutClient({
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const isLoginPage = pathname === "/admin/login";
  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);

  useEffect(() => {
    if (isLoginPage) {
      setIsReady(true);
      return;
    }

    const token = localStorage.getItem("admin_jwt");
    if (!token) {
      clearAdminSession();
      router.replace("/admin/login");
      return;
    }

    try {
      setIdentity(decodeToken(token));
      setIsReady(true);
    } catch {
      clearAdminSession();
      router.replace("/admin/login");
    }
  }, [isLoginPage, pathname, router]);

  useEffect(() => {
    if (isLoginPage) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [isLoginPage]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <div className="rr-admin-root rr-admin-root--login">{children}</div>;
  }

  if (!isReady || !identity) {
    return (
      <div className="rr-admin-root">
        <div className="rr-admin-guard">
          <div className="rr-admin-guardPanel">
            <ShieldCheck size={24} />
            <h1>Checking admin session</h1>
            <p>Validating access and loading the workspace.</p>
          </div>
        </div>
      </div>
    );
  }

  const sessionLabel = getSessionLabel(identity.expiresAt);
  const initials = getInitials(identity.name);

  return (
    <div className="rr-admin-root">
      <div className="rr-admin-shell">
        <aside className={`rr-admin-sidebar ${navOpen ? "is-open" : ""}`}>
          <div className="rr-admin-sidebarHeader">
            <Link href="/admin" className="rr-admin-brand">
              <span className="rr-admin-brandMark">RR</span>
              <span className="rr-admin-brandCopy">
                <strong>Rani Riwaaj</strong>
                <small>Admin Console</small>
              </span>
            </Link>
            <button
              type="button"
              className="rr-admin-sidebarClose"
              aria-label="Close navigation"
              onClick={() => setNavOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="rr-admin-userCard">
            <div className="rr-admin-userAvatar" aria-hidden="true">
              {initials}
            </div>
            <div className="rr-admin-userCopy">
              <span className="rr-admin-sidebarEyebrow">Authenticated</span>
              <strong>{identity.name}</strong>
              <p>{identity.role}</p>
              <div className="rr-admin-sessionInline">
                <span className="rr-admin-statusDot" aria-hidden="true" />
                <small>{sessionLabel}</small>
              </div>
            </div>
          </div>

          <div className="rr-admin-sidebarSectionLabel">Workspace</div>
          <nav className="rr-admin-nav" aria-label="Admin navigation">
            {NAV_ITEMS.map(({ href, icon: Icon, label, matcher }) => {
              const isActive = matcher(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rr-admin-navItem ${isActive ? "is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="rr-admin-sidebarFooter">
            <div className="rr-admin-sessionCard">
              <div className="rr-admin-sessionTitleRow">
                <span className="rr-admin-statusDot" aria-hidden="true" />
                <span>{sessionLabel}</span>
              </div>
              <small>Secure access · {formatNow(now)}</small>
            </div>
            <button
              type="button"
              className="rr-admin-button rr-admin-button--dangerSoft rr-admin-button--block"
              onClick={() => {
                clearAdminSession();
                startTransition(() => router.push("/admin/login"));
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        {navOpen ? (
          <button
            type="button"
            className="rr-admin-overlay"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        <div className="rr-admin-main">
          <header className="rr-admin-topbar">
            <div className="rr-admin-topbarMain">
              <button
                type="button"
                className="rr-admin-topbarMenu"
                aria-label="Open navigation"
                onClick={() => setNavOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="rr-admin-topbarCopy">
                <span className="rr-admin-kicker">{pageMeta.kicker}</span>
                <p className="rr-admin-topbarTitle">{pageMeta.label}</p>
                <span className="rr-admin-topbarDescription">{pageMeta.description}</span>
              </div>
            </div>

            <div className="rr-admin-topbarAside">
              <div className="rr-admin-topbarStatus">
                <span className="rr-admin-chip rr-admin-chip--status">
                  <span className="rr-admin-statusDot" aria-hidden="true" />
                  {sessionLabel}
                </span>
                <span className="rr-admin-identityPill">
                  <span className="rr-admin-identityAvatar" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="rr-admin-identityCopy">
                    <strong>{identity.name}</strong>
                    <small>{identity.role}</small>
                  </span>
                </span>
                <span className="rr-admin-timeLabel">
                  <Clock3 size={14} />
                  {formatNow(now)}
                </span>
              </div>

              <div className="rr-admin-topbarActions">
                <Link
                  href="/admin/products/create"
                  className="rr-admin-button rr-admin-button--primary"
                >
                  <Plus size={16} />
                  New Product
                </Link>
                <Link
                  href="/"
                  className="rr-admin-button rr-admin-button--secondary"
                >
                  <ArrowUpRight size={16} />
                  View Store
                </Link>
              </div>
            </div>
          </header>

          <div className="rr-admin-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
