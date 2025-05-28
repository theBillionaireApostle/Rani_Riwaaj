"use client"

import { ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faChartLine, faBoxOpen, faThList, faSignOutAlt, faBars, faTag, faCog } from "@fortawesome/free-solid-svg-icons"

interface SidebarProps {
  children: ReactNode
}

export default function ProtectedSidebar({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Handle viewport resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  const toggleSidebar = () => setCollapsed(prev => !prev)

  return (
    <div className={`admin-container ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <button
          className="sidebar-toggle"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <nav className="sidebar-nav">
          <Link href="/admin/analytics" className="sidebar-link">
            <FontAwesomeIcon icon={faChartLine} />
            <span className="link-text">Analytics</span>
          </Link>
          <Link href="/admin" className="sidebar-link">
            <FontAwesomeIcon icon={faBoxOpen} />
            <span className="link-text">Products</span>
          </Link>
          <Link href="/admin/categories" className="sidebar-link">
            <FontAwesomeIcon icon={faThList} />
            <span className="link-text">Categories</span>
          </Link>
          <Link href="/admin/tags" className="sidebar-link">
            <FontAwesomeIcon icon={faTag} />
            <span className="link-text">Tags</span>
          </Link>
          <Link href="/admin/settings" className="sidebar-link">
            <FontAwesomeIcon icon={faCog} />
            <span className="link-text">Settings</span>
          </Link>
        </nav>
        <button className="sidebar-link logout" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span className="link-text">Logout</span>
        </button>
      </aside>
      <main className="admin-main"> {children} </main>
    </div>
  )
}
