'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import { useAuthStore } from '@/store/auth'

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <MainLayout requireAuth={false}>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Welcome to DataLabel</h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          A powerful platform for data labeling and annotation
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            Get Started
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}