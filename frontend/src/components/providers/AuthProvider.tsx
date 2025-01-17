'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const publicPaths = ['/login', '/register', '/']

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated && !publicPaths.includes(pathname)) {
      router.push('/login')
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}