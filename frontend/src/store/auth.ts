// types/auth.ts
export interface Profile {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  success: boolean
  message: string
  requiresConfirmation?: boolean
}

// store/auth.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: Profile | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  subscription: (() => void) | null
  initializeAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<{
    success: boolean
    message: string
    requiresConfirmation?: boolean
  }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  refreshSession: () => Promise<void>
  setSession: (session: any) => void
  cleanup: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: false,
      subscription: null,

      initializeAuth: async () => {
        try {
          console.log('[Auth] Starting initialization')
          
          // Get initial session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          console.log('[Auth] Initial session check:', { 
            hasSession: !!session, 
            error: sessionError?.message,
            userId: session?.user?.id 
          })
          
          // Always set isInitialized to true, even if there's no session
          if (!session || sessionError) {
            console.log('[Auth] No session found, completing initialization')
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isInitialized: true  // Mark as initialized even without session
            })
            return
          }
      
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('[Auth] State change:', { event, hasSession: !!session })
              
              if (session) {
                try {
                  const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                  
                  if (profileError) throw profileError
      
                  set({
                    user: profile,
                    token: session.access_token,
                    refreshToken: session.refresh_token,
                    isAuthenticated: true
                  })
                } catch (error) {
                  console.error('[Auth] Profile fetch error:', error)
                  set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false
                  })
                }
              } else {
                set({
                  user: null,
                  token: null,
                  refreshToken: null,
                  isAuthenticated: false
                })
              }
            }
          )
      
          // Store subscription cleanup
          set({ subscription: () => subscription.unsubscribe() })
      
          // Handle initial session
          if (session?.user) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
      
            if (profileError) throw profileError
      
            set({
              user: profile,
              token: session.access_token,
              refreshToken: session.refresh_token,
              isAuthenticated: true,
              isInitialized: true
            })
          } else {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isInitialized: true
            })
          }
        } catch (error) {
          console.error('[Auth] Initialization error:', error)
          // Always set isInitialized to true, even on error
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isInitialized: true
          })
        }
      },

      cleanup: () => {
        const subscription = get().subscription
        if (subscription) {
          subscription()
          set({ subscription: null })
        }
      },

      login: async (email: string, password: string) => {
        try {
          console.log('[Auth] Attempting login')
          
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

          // Upsert profile to handle race conditions
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              name: userName || 'User',
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (profileError) throw profileError

          set({
            user: profileData,
            token: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            isAuthenticated: true,
          })

          console.log('[Auth] Login successful')
        } catch (error) {
          console.error('[Auth] Login error:', error)
          throw error
        }
      },

      signup: async (email: string, password: string, name: string) => {
        try {
          console.log('[Auth] Attempting signup')
          
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
            console.log('[Auth] Signup requires email confirmation')
            return {
              success: true,
              message: 'Please check your email to confirm your account before signing in.',
              requiresConfirmation: true
            }
          }

          // Create profile with upsert to avoid race conditions
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: authData.user.email,
              name: trimmedName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (profileError) throw profileError

          console.log('[Auth] Signup successful')
          return {
            success: true,
            message: 'Account created successfully.',
            requiresConfirmation: false
          }
        } catch (error) {
          console.error('[Auth] Signup error:', error)
          return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
          }
        }
      },

      resetPassword: async (email: string) => {
        try {
          console.log('[Auth] Attempting password reset')
          const { error } = await supabase.auth.resetPasswordForEmail(email)
          if (error) throw error
          console.log('[Auth] Password reset email sent')
        } catch (error) {
          console.error('[Auth] Password reset error:', error)
          throw error
        }
      },

      updatePassword: async (newPassword: string) => {
        try {
          console.log('[Auth] Attempting password update')
          const { error } = await supabase.auth.updateUser({
            password: newPassword
          })
          if (error) throw error
          console.log('[Auth] Password updated successfully')
        } catch (error) {
          console.error('[Auth] Password update error:', error)
          throw error
        }
      },

      refreshSession: async () => {
        try {
          console.log('[Auth] Attempting session refresh')
          const { data: { session }, error } = await supabase.auth.refreshSession()
          if (error) throw error
          if (session) {
            set({
              token: session.access_token,
              refreshToken: session.refresh_token,
              isAuthenticated: true
            })
            console.log('[Auth] Session refreshed successfully')
          }
        } catch (error) {
          console.error('[Auth] Session refresh error:', error)
          throw error
        }
      },

      setSession: (session) => {
        if (session?.user) {
          console.log('[Auth] Setting session')
          supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          })
          set({
            token: session.access_token,
            refreshToken: session.refresh_token,
            isAuthenticated: true
          })
        } else {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false
          })
        }
      },

      logout: async () => {
        try {
          console.log('[Auth] Attempting logout')
          await supabase.auth.signOut()
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
          console.log('[Auth] Logout successful')
        } catch (error) {
          console.error('[Auth] Logout error:', error)
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        console.log('[Auth] Rehydrating storage:', {
          hasState: !!state,
          hasUser: !!state?.user,
          hasToken: !!state?.token,
          hasRefreshToken: !!state?.refreshToken
        })
        
        if (state?.token && state?.refreshToken) {
          supabase.auth.setSession({
            access_token: state.token,
            refresh_token: state.refreshToken
          })
        }

        return state
      }
    }
  )
)