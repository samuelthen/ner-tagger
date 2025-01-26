import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/profile'

interface AuthState {
  user: Profile | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  initializeAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<{ 
    success: boolean;
    message: string;
    requiresConfirmation?: boolean;
  }>
  logout: () => Promise<void>
  setSession: (session: any) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,

      initializeAuth: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            set({
              user: profile || null,
              token: session.access_token,
              isAuthenticated: true,
              isInitialized: true
            })
          } else {
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false,
              isInitialized: true
            })
          }
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            isInitialized: true
          })
        }
      },

      setSession: (session) => {
        if (session?.user) {
          set({
            token: session.access_token,
            isAuthenticated: true
          })
        } else {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          })
        }
      },

      signup: async (email: string, password: string, name: string) => {
        try {
          const trimmedName = name.trim()
          
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: trimmedName
              },
            },
          })

          if (authError) throw authError

          if (!authData.user) {
            throw new Error('Failed to create user account')
          }

          // Check if email confirmation is required
          if (authData.session === null) {
            return {
              success: true,
              message: 'Please check your email to confirm your account before signing in.',
              requiresConfirmation: true
            }
          }

          return {
            success: true,
            message: 'Account created successfully.',
            requiresConfirmation: false
          }

        } catch (error) {
          console.error('Signup error:', error)
          return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
          }
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          if (error) throw error

          if (!data.user) {
            throw new Error('No user returned from login')
          }

          // Check if email is confirmed
          if (!data.user.email_confirmed_at) {
            throw new Error('Please confirm your email address before signing in')
          }

          const userName = data.user.user_metadata?.name

          // Try to get existing profile
          const { data: profileData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (fetchError && fetchError.code === 'PGRST116') {
            // Create new profile
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                name: userName || 'User',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) throw createError

            set({
              user: newProfile,
              token: data.session?.access_token || null,
              isAuthenticated: true,
            })
          } else if (fetchError) {
            throw fetchError
          } else {
            set({
              user: profileData,
              token: data.session?.access_token || null,
              isAuthenticated: true,
            })
          }
        } catch (error) {
          console.error('Login error:', error)
          throw error
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({ user: null, token: null, isAuthenticated: false })
        } catch (error) {
          console.error('Logout error:', error)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)