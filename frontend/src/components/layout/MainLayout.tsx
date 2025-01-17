'use client'

import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: ReactNode
  requireAuth?: boolean
}

export default function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
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