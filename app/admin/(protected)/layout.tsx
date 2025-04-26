"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ProtectedSidebar from "./ProtectedSidebar"
import "../../admin/admin.css"

interface Props { children: ReactNode }

export default function ProtectedAdminLayout({ children }: Props) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("admin_jwt")
    if (!token) {
      router.push("/admin/login")
      return
    }

    try {
      // 1. Split token into [header, payload, signature]
      const parts = token.split(".")
      if (parts.length !== 3) throw new Error("Invalid token format")

      // 2. Base64‑decode payload
      const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      const payload = JSON.parse(payloadJson) as { exp?: number }
      
      // 3. Validate expiry
      if (!payload.exp || Date.now() >= payload.exp * 1000) {
        throw new Error("Token expired")
      }

      // 4. All good!
      setAuthorized(true)
    } catch {
      localStorage.removeItem("admin_jwt")
      router.push("/admin/login")
    }
  }, [router])

  // Don’t render the admin UI until we’re authorized
  if (!authorized) return null

  return (
    <ProtectedSidebar>
      {children}
    </ProtectedSidebar>
  )
}