'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'

interface DebugState {
  componentState: string
  lastAction: string | null
  authStatus: {
    isInitialized?: boolean
    isAuthenticated?: boolean
    hasSession?: boolean
  } | null
  error: string | null
}

const DebugPanel = ({ state }: { state: any }) => (
  <div className="fixed bottom-4 right-4 max-w-md rounded-lg bg-black bg-opacity-80 p-4 text-xs text-white">
    <pre className="overflow-auto">
      {JSON.stringify(state, null, 2)}
    </pre>
  </div>
)

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
  const [debugState, setDebugState] = useState<DebugState>({
    componentState: 'initializing',
    lastAction: null,
    authStatus: null,
    error: null
  })

  // Initialize auth and check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[Login] Checking initial auth state')
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('[Login] Current session:', { 
          hasSession: !!session, 
          error: sessionError?.message 
        })

        if (!isInitialized) {
          console.log('[Login] Initializing auth store')
          await initializeAuth()
        }

        setDebugState(prev => ({
          ...prev,
          componentState: 'initialized',
          authStatus: {
            isInitialized,
            isAuthenticated,
            hasSession: !!session
          }
        }))
      } catch (error) {
        console.error('[Login] Auth check error:', error)
        setDebugState(prev => ({
          ...prev,
          componentState: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }))
      }
    }

    checkAuth()
  }, [isInitialized, isAuthenticated, initializeAuth])

  // Handle auth state changes
  useEffect(() => {
    console.log('[Login] Auth state changed:', { 
      isInitialized, 
      isAuthenticated 
    })

    if (isAuthenticated && isInitialized) {
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      console.log('[Login] Redirecting to:', redirectTo)
      router.push(redirectTo)
    }

    setDebugState(prev => ({
      ...prev,
      authStatus: {
        isInitialized,
        isAuthenticated
      }
    }))
  }, [isAuthenticated, isInitialized, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    console.log('[Login] Attempting login:', { email })

    setDebugState(prev => ({
      ...prev,
      lastAction: 'login_attempt',
      componentState: 'logging_in'
    }))

    try {
      console.log('[Login] Calling login function')
      await login(email, password)
      
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      console.log('[Login] Login successful, redirecting to:', redirectTo)
      
      setDebugState(prev => ({
        ...prev,
        lastAction: 'login_success',
        componentState: 'redirecting'
      }))

      router.push(redirectTo)
    } catch (error: any) {
      console.error('[Login] Login error:', error)
      
      let errorMessage = error.message || 'An error occurred during sign in'
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (error.message.includes('confirm your email')) {
        errorMessage = 'Please confirm your email address before signing in'
      }

      setError(errorMessage)
      setDebugState(prev => ({
        ...prev,
        lastAction: 'login_error',
        componentState: 'error',
        error: errorMessage
      }))
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

  // Debug current state
  const currentState = {
    isInitialized,
    isAuthenticated,
    isLoading,
    error,
    debug: debugState
  }

  // Show loading state while checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
        <DebugPanel state={currentState} />
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
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white px-8 pb-8 pt-6 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="mt-2 text-gray-600">Sign in to your account</p>
            </div>
            
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {renderForm()}

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <DebugPanel state={currentState} />
    </div>
  )
}