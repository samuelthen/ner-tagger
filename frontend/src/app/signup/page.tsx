'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function SignUpPage() {
  const signup = useAuthStore((state) => state.signup);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Basic validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (!name.trim()) {
        throw new Error('Please enter your name');
      }

      const result = await signup(email, password, name);
      
      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="px-4 py-3">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-xl font-bold text-gray-900">
            CrocodAI
          </Link>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-xl bg-white px-8 pb-8 pt-6 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="mt-2 text-gray-600">Sign up to get started</p>
            </div>
            
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-black">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="name">
                  Full Name
                </label>
                <input
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading || !!success}
                />
              </div>

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
                  disabled={isLoading || !!success}
                  autoComplete="email"
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
                  placeholder="Create a password (min. 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || !!success}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <button
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                type="submit"
                disabled={isLoading || !!success}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}