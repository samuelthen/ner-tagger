import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface TeamMember {
  user_id: string;
  profiles: Array<{
    email: string;
  }>;
}

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

    // 1. First get the teams the user is a member of
    const { data: userTeams, error: teamsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', session.user.id)

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return NextResponse.json(
        { error: teamsError.message },
        { status: 500 }
      )
    }

    if (!userTeams?.length) {
      return NextResponse.json([])
    }

    const teamIds = userTeams.map(t => t.team_id)

    // 2. Get projects for those teams along with team names
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        team_id,
        created_at,
        teams!inner (
          name
        )
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: projectsError.message },
        { status: 500 }
      )
    }

    // 3. Transform projects with additional data
    const transformedProjects = await Promise.all(projectsData.map(async (project: any) => {
      // Get files count
      const { count: totalItems } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.id)
        || { count: 0 }

      // Get team members
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles (
            email
          )
        `)
        .eq('team_id', project.team_id)

      // Handle null teamMembers and safely extract emails
      const memberEmails = (teamMembers || []).flatMap(member => {
        if (Array.isArray(member.profiles)) {
          return member.profiles.map(profile => profile.email?.split('@')[0] || '').filter(Boolean)
        }
        return []
      })

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        team_id: project.team_id,
        created_at: project.created_at,
        teamName: project.teams.name,
        teamMembers: memberEmails,
        totalItems: totalItems || 0
      }
    }))

    return NextResponse.json(transformedProjects)

  } catch (error) {
    console.error('Error in projects API route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}