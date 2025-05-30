'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { supabase as supabaseClient } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'

interface TeamMember {
  email: string;
  role: 'admin' | 'member';
}

export default function CreateTeamPage() {
  const router = useRouter()
  const { isAuthenticated, isInitialized, user } = useAuthStore()
  
  const [teamName, setTeamName] = useState('')
  const [members, setMembers] = useState<TeamMember[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/auth/login?redirect=/team/create')
    }
  }, [isInitialized, isAuthenticated, router])

  const checkUserExists = async (email: string) => {
    setIsCheckingEmail(true)
    setError('')
    
    try {
      const { data, error } = await supabaseClient
        .rpc('check_user_exists', { 
          p_email: email 
        })

      if (error) {
        setError('Error checking email')
        return false
      }

      // Explicitly return boolean
      return Boolean(data)

    } catch (err) {
      setError('Error checking email')
      return false
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const addMember = async () => {
    if (!newMemberEmail) return
    
    // Clear previous states
    setError('')
    setIsCheckingEmail(true)
    
    try {
      // Basic validations
      if (members.some(m => m.email === newMemberEmail)) {
        setError('This email has already been added')
        setIsCheckingEmail(false)
        return
      }

      if (newMemberEmail === user?.email) {
        setError('You will automatically be added as an admin')
        setIsCheckingEmail(false)
        return
      }

      // Check if user exists
      const exists = await checkUserExists(newMemberEmail)
      
      if (!exists) {
        setError('No account found with this email address')
        return
      }

      // Only add member if user exists
      setMembers(prevMembers => [...prevMembers, { email: newMemberEmail, role: 'member' }])
      setNewMemberEmail('')

    } catch (err) {
      setError('Error checking email address')
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const removeMember = (email: string) => {
    setMembers(members.filter(member => member.email !== email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
  
    try {
      if (!user?.id) {
        throw new Error('Not authenticated')
      }
  
      if (!teamName.trim()) {
        throw new Error('Team name is required')
      }
  
      const { data: team, error: createError } = await supabaseClient
        .rpc('create_team_with_members', {
          p_invites: members,
          p_team_name: teamName.trim(),
          p_user_id: user.id
        })
  
      if (createError) {
        console.error('Team creation error:', createError)
        throw new Error(createError.message)
      }
  
      router.push('/team')
    } catch (err: any) {
      console.error('Error creating team:', err)
      setError(err.message || 'An error occurred while creating the team')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newMemberEmail) {
      e.preventDefault()
      setIsCheckingEmail(true)
      try {
        await addMember()
      } catch (err) {
        console.error('Error:', err)
        setError('Error checking email')
      } finally {
        setIsCheckingEmail(false)
      }
    }
  }

  // Show loading state while checking auth
  if (!isInitialized) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </MainLayout>
    )
  }

  // Don't render the form if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-2xl font-bold text-black">Create New Team</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Add Members</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Email address"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={isLoading || isCheckingEmail}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckingEmail(true)
                      addMember().catch(err => {
                        console.error('Error:', err)
                        setError('Error checking email')
                      }).finally(() => setIsCheckingEmail(false))
                    }}
                    disabled={!newMemberEmail || isLoading || isCheckingEmail}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isCheckingEmail ? 'Checking...' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-4 font-medium text-gray-900">Team Members</h3>
                {members.length === 0 ? (
                  <p className="text-sm text-gray-500">No members added yet</p>
                ) : (
                  members.map((member) => (
                    <div key={member.email} className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-900">{member.email}</span>
                      <button
                        type="button"
                        onClick={() => removeMember(member.email)}
                        disabled={isLoading}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Link
                  href="/team"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}