'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    redirect('/projects')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900">
              AI
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/signup"  
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Data Labeling Made{' '}
            <span className="text-green-600">Simple</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
            A powerful platform for efficient data labeling and annotation. 
            Build better AI models with high-quality training data.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup" 
              className="rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}