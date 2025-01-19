import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/profile'

interface AuthState {
  user: Profile | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<{ 
    success: boolean;
    message: string;
    requiresConfirmation?: boolean;
  }>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      signup: async (email: string, password: string, name: string) => {
        try {
          console.log('Starting signup with:', { email, name });
          
          const trimmedName = name.trim();
          
          // Only create the auth user with metadata first
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: trimmedName // Store name in metadata
              },
            },
          })

          if (authError) {
            console.error('Auth signup error:', authError);
            return {
              success: false,
              message: authError.message
            }
          }

          if (!authData.user) {
            return {
              success: false,
              message: 'Failed to create user account'
            }
          }

          // Don't create profile yet - it will be created on first login
          // after email confirmation

          return {
            success: true,
            message: 'Please check your email to confirm your account before signing in.',
            requiresConfirmation: true
          }

        } catch (error) {
          console.error('Signup process error:', error);
          return {
            success: false,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
          }
        }
      },

      login: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error

        if (data.user) {
          // Get the user's name from auth metadata
          const userName = data.user.user_metadata?.name || 'User';
          
          // Check if profile exists
          const { data: profileData, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (fetchError && fetchError.code === 'PGRST116') { // Not found
            // Create profile using auth metadata
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                name: userName,
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
            // Profile exists, use it
            set({
              user: profileData,
              token: data.session?.access_token || null,
              isAuthenticated: true,
            })
          }
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