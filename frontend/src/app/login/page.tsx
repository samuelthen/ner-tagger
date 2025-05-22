'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Initialize auth and check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isInitialized) {
          await initializeAuth()
        }
      } catch (error) {
        console.error('[Login] Auth check error:', error)
      }
    }

    checkAuth()
  }, [isInitialized, isAuthenticated, initializeAuth])

  // Handle auth state changes
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
    }
  }, [isAuthenticated, isInitialized, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
    } catch (error: any) {
      let errorMessage = error.message || 'An error occurred during sign in'
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message.includes('confirm your email')) {
        errorMessage = 'Please confirm your email address before signing in'
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6 text-black">
      <div>
        <label className="text-sm font-medium text-gray-700" htmlFor="email">
          Email address
        </label>
        <input
          className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <input
          className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>

        <Link
          href="/forgot-password"
          className="text-sm font-medium text-green-600 hover:text-green-500"
        >
          Forgot password?
        </Link>
      </div>
      
      <button
        className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )

  // Show loading state while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-xl font-bold text-gray-900">
            AI
          </Link>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/signup" className="font-medium text-green-600 hover:text-green-500">
                create a new account
              </Link>
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {renderForm()}
        </div>
      </div>
    </div>
  )
}