import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (!session || sessionError) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // 1. First get just the team IDs for teams the user is a member of
    const { data: userTeamMemberships, error: membershipError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', session.user.id)

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError)
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      )
    }

    if (!userTeamMemberships?.length) {
      return NextResponse.json([])
    }

    const teamIds = userTeamMemberships.map(tm => tm.team_id)

    // Add check for empty teamIds array
    if (teamIds.length === 0) {
      return NextResponse.json([])
    }

    // 2. Get basic team info
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, created_at, created_by')
      .in('id', teamIds)
      .order('created_at', { ascending: false })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return NextResponse.json(
        { error: teamsError.message },
        { status: 500 }
      )
    }

    // 3. For each team, get its members
    const transformedTeams = await Promise.all(teams.map(async (team) => {
      // Get member info
      const { data: members } = await supabase
        .from('team_members')
        .select('id, user_id, role')
        .eq('team_id', team.id)

      // Get invite count
      const { data: invites } = await supabase
        .from('team_invites')
        .select('id')
        .eq('team_id', team.id)
        .eq('status', 'pending')

      return {
        id: team.id,
        name: team.name,
        created_at: team.created_at,
        created_by: team.created_by,
        members: members?.map(member => ({
          id: member.id,
          email: member.user_id, // For now, just use the user_id as email
          role: member.role
        })) || [],
        pendingInvites: invites?.length || 0
      }
    }))

    return NextResponse.json(transformedTeams)

  } catch (error) {
    console.error('Error in teams API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}