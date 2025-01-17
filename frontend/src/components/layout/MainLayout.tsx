// src/components/layout/MainLayout.tsx
'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
  requireAuth?: boolean
}

export default function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
  const pathname = usePathname()
  const publicPaths = ['/', '/login', '/signup']
  const isPublicRoute = publicPaths.includes(pathname)

  // For public routes, render without nav and sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For authenticated routes, render with nav and sidebar
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}