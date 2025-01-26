'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { ArrowRight, Plus, Mail } from 'lucide-react'
import MainLayout from '@/components/layout/MainLayout'

interface Team {
  id: string
  name: string
  created_at: string
  created_by: string
  member_count: number
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchTeams()
  }, [])

  async function fetchTeams() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get teams where user is owner or member
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          created_by,
          team_members!inner (count)
        `)
        .or(`created_by.eq.${user.id},team_members.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setTeams(data.map(team => ({
          ...team,
          member_count: team.team_members[0].count
        })))
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(teamId: string) {
    // Implement invite modal/functionality
    console.log('Invite for team:', teamId)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            <Link
              href="/team/create"
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              New Team
            </Link>
          </div>

          {loading ? (
            <div className="text-center">Loading...</div>
          ) : teams.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center">
              <h3 className="mb-2 text-lg font-medium text-black">No teams yet</h3>
              <p className="mb-4 text-gray-600">Create your first team to get started</p>
              <Link
                href="/team/create"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
              >
                Create a team <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => (
                <div key={team.id} className="rounded-lg bg-white p-6 shadow-sm">
                  <h3 className="mb-2 text-lg font-medium">{team.name}</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    {team.member_count} members
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href={`/team/${team.id}`}
                      className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleInvite(team.id)}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <Mail className="h-4 w-4" />
                      Invite
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}