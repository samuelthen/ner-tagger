'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const publicPaths = ['/login', '/signup', '/', '/forgot-password', '/reset-password']

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  // Initialize auth on mount
  useEffect(() => {
    console.log('[AuthProvider] Initializing auth...')
    initializeAuth()
  }, [initializeAuth])

  // Add debug logging for state changes
  useEffect(() => {
    console.log('[AuthProvider] State updated:', {
      isInitialized,
      isAuthenticated,
      pathname,
      isPublicPath: publicPaths.includes(pathname)
    })

    if (!isInitialized) return

    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      console.log('[AuthProvider] Redirecting to login')
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isInitialized, isAuthenticated, pathname, router])

  // Show loading state only during initial auth check
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // If not authenticated and not on a public path, don't render children
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return null
  }

  return <>{children}</>
}