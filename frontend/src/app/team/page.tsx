'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Search, Filter, MoreVertical, UserPlus, Settings, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

// Types remain the same...
interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  created_at: string
  profiles?: {
    email: string
  }
}

interface TeamInvite {
  id: string
  team_id: string
  email: string
  role: string
  status: string
  created_at: string
}

interface Team {
  id: string
  name: string
  created_at: string
  created_by: string
  team_members: TeamMember[]
  team_invites?: TeamInvite[]
}

interface TransformedTeam extends Omit<Team, 'team_members'> {
  members: {
    id: string
    email: string
    role: string
  }[]
  pendingInvites: number
}

export default function TeamsPage() {
  const router = useRouter()
  const { isInitialized, isAuthenticated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState<TransformedTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    console.log('[Teams] Auth state:', {
      isInitialized,
      isAuthenticated,
      hasUser: !!user
    })

    if (isInitialized && !isAuthenticated) {
      console.log('[Teams] No auth, redirecting to login')
      router.push('/login?redirect=/team')
      return
    }
  }, [isInitialized, isAuthenticated, user, router])

  // Fetch teams only when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTeams()
    }
  }, [isAuthenticated, user])

  const fetchTeams = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
  
      const response = await fetch('/api/team', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
  
      const teamsData = await response.json()
      
      console.log('Teams data:', teamsData) // Debug log
  
      const transformedTeams: TransformedTeam[] = teamsData.map((team: Team) => {
        const members = team.team_members?.map((member: TeamMember) => ({
          id: member.id,
          email: member.profiles?.email || '',
          role: member.role
        })) || []
  
        const pendingInvites = team.team_invites?.filter((invite: TeamInvite) => 
          invite.status === 'pending'
        ).length || 0
  
        return {
          id: team.id,
          name: team.name,
          created_at: team.created_at,
          created_by: team.created_by,
          members,
          pendingInvites
        }
      })
  
      setTeams(transformedTeams)
    } catch (error: any) {
      console.error('Error fetching teams:', error)
      setError(error.message || 'An error occurred while fetching teams')
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show loading state while checking authentication
  if (!isInitialized || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your teams and team members</p>
          </div>
          <button 
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            onClick={() => router.push('/team/create')}
          >
            <Plus className="h-4 w-4" />
            New Team
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="mt-1">{error}</p>
            <button
              onClick={fetchTeams}
              className="mt-4 rounded bg-red-100 px-4 py-2 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams..."
              className="flex-1 border-none text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* <button className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filters
          </button> */}
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-white p-6">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-4 h-2 rounded bg-gray-200" />
              </div>
            ))
          ) : filteredTeams.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              {error ? 'Error loading teams' : 'No teams found'}
            </div>
          ) : (
            filteredTeams.map((team) => (
              <div key={team.id} className="rounded-lg border bg-white shadow-sm">
                <div className="p-6">
                  {/* Team Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {team.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Created {new Date(team.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="rounded p-1 hover:bg-gray-100">
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Team Members */}
                  {/* <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Team Members</h4>
                      <span className="text-sm text-gray-500">{team.members.length} members</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {team.members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium"
                          title={member.email}
                        >
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {team.members.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-600">
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Pending Invites */}
                  {/* {team.pendingInvites > 0 && (
                    <div className="mt-4">
                      <span className="text-sm text-gray-500">
                        {team.pendingInvites} pending {team.pendingInvites === 1 ? 'invite' : 'invites'}
                      </span>
                    </div>
                  )} */}
                </div>

                {/* Action Buttons */}
                {/* <div className="border-t px-6 py-4">
                  <div className="flex gap-2">
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100">
                      <UserPlus className="h-4 w-4" />
                      Invite Member
                    </button>
                    <button className="rounded-md p-2 hover:bg-gray-100">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="rounded-md p-2 hover:bg-gray-100">
                      <Settings className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div> */}
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  )
}