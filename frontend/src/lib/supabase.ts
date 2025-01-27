// lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Add more detailed initialization logging
const initSupabase = () => {
  try {
    if (typeof window === 'undefined') {
      console.log('[Supabase] Skipping client init - server context')
      return null
    }

    console.log('[Supabase] Initializing client:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      storage: typeof localStorage !== 'undefined' ? 'available' : 'unavailable'
    })

    const client = createClientComponentClient()
    
    // Test session immediately
    client.auth.getSession().then(({ data, error }) => {
      console.log('[Supabase] Initial session check:', {
        hasSession: !!data.session,
        error: error?.message
      })
    })

    return client
  } catch (error) {
    console.error('[Supabase] Init error:', error)
    return null
  }
}

export const supabase = initSupabase() || createClientComponentClient()