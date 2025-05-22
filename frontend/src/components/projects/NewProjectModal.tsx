'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Team {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  teams: Team;
}

interface TeamResponse {
  id: string;
  team_id: string;
  role: string;
  teams: Team;  // Using the Team interface we already defined
}

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: () => void;
}

export default function NewProjectModal({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}: NewProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NER',
    team_id: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchUserTeams()
    }
  }, [isOpen])

  const fetchUserTeams = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) throw userError
      if (!user) throw new Error('No user found')

      const { data: teamMembers, error: teamsError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          role,
          teams (
            id,
            name,
            created_at,
            created_by
          )
        `)
        .eq('user_id', user.id)

      console.log('Raw team members data:', teamMembers) // Debug log

      if (teamsError) throw teamsError

      if (!teamMembers) {
        console.log('No team members found') // Debug log
        setTeams([])
        return
      }

      // Transform the response data into the correct structure
      const userTeams = (teamMembers as unknown as TeamResponse[])
        .filter(member => member.teams != null) // Filter out any null teams
        .map(member => ({
          id: member.teams.id,
          name: member.teams.name,
          created_at: member.teams.created_at,
          created_by: member.teams.created_by
        }))

      console.log('Transformed teams data:', userTeams) // Debug log

      setTeams(userTeams)
      
      // Set default team if available
      if (userTeams.length > 0) {
        setFormData(prev => ({ ...prev, team_id: userTeams[0].id }))
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      setError('Failed to load teams')
    }
  }

  if (!isOpen) return null

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'NER',
      team_id: teams.length > 0 ? teams[0].id : ''
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      setLoading(true)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error('Authentication error: ' + userError.message)
      }

      if (!user) {
        throw new Error('You must be logged in to create a project')
      }

      if (!formData.team_id) {
        throw new Error('Please select a team for the project')
      }

      // Verify user is a member of the selected team
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('team_id', formData.team_id)
        .single()

      if (memberError || !teamMember) {
        throw new Error('You are not a member of the selected team')
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          description: formData.description,
          type: formData.type,
          status: 'Created',
          progress: 0,
          created_by: user.id,
          team_id: formData.team_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (projectError) {
        console.error('Supabase error:', projectError)
        throw new Error(projectError.message)
      }

      if (!project) {
        throw new Error('Failed to create project: No data returned')
      }

      resetForm()
      onProjectCreated?.()
      onClose()

    } catch (error: any) {
      console.error('Error creating project:', error)
      setError(error.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
        <p className="mt-1 text-sm text-gray-500">
          Create a new labeling project. You can add data files later.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-black">
          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700">
              Team
            </label>
            <select
              id="team"
              value={formData.team_id}
              onChange={(e) => setFormData(prev => ({ ...prev, team_id: e.target.value }))}
              disabled={loading || teams.length === 0}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                        focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {teams.length === 0 ? (
                <option value="">No teams available</option>
              ) : (
                teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Project Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                        focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          {/* <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Project Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                        focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="NER">Named Entity Recognition</option>
              <option value="Classification">Text Classification</option>
              <option value="Sentiment">Sentiment Analysis</option>
            </select>
          </div> */}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Describe your project"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={loading}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                        focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium 
                       text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || teams.length === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white 
                       hover:bg-green-700 disabled:bg-green-300"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}