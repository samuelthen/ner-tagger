import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: null | { id: string; email: string; name: string }
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error

        if (data.user) {
          set({
            user: { 
              id: data.user.id, 
              email: data.user.email!, 
              name: data.user.user_metadata.name || 'User'
            },
            token: data.session?.access_token || null,
            isAuthenticated: true,
          })
        }
      },
      signup: async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        })

        if (error) throw error

        if (data.user) {
          set({
            user: { 
              id: data.user.id, 
              email: data.user.email!, 
              name: name 
            },
            token: data.session?.access_token || null,
            isAuthenticated: true,
          })
        }
      },
      logout: async () => {
        await supabase.auth.signOut()
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)