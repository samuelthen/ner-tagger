'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import NewProjectModal from '@/components/projects/NewProjectModal'
import { Plus, Search, Filter, MoreVertical, FileText, Users, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Project, ProjectWithStats } from '@/types/project'

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (projectsError) {
        throw new Error(`Failed to fetch projects: ${projectsError.message}`)
      }

      if (!projectsData) {
        setProjects([])
        return
      }

      const transformedProjects = await Promise.all(
        projectsData.map(async (dbProject: Project) => {
          try {
            // Get total files count for the project
            const { count: totalItems } = await supabase
              .from('files')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', dbProject.id)
              || { count: 0 }
      
            // First get all file IDs for this project
            const { data: projectFiles } = await supabase
              .from('files')
              .select('id')
              .eq('project_id', dbProject.id)
      
            // Then count labels for those files
            const { count: labeledItems } = await supabase
              .from('labels')
              .select('*', { count: 'exact', head: true })
              .in('file_id', projectFiles?.map(f => f.id) || [])
              || { count: 0 }
      
            // Get team members data
            const { data: teamData } = await supabase
              .from('user_activities')
              .select('user_id')
              .eq('project_id', dbProject.id)
              || { data: [] }
      
            const userIds = [...new Set(teamData?.map(t => t.user_id) || [])]
      
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('email')
              .in('id', userIds)
              || { data: [] }
      
            const teamMembers = profilesData?.map(profile => 
              profile.email.split('@')[0]
            ) || []
      
            // Calculate progress
            const progress = totalItems && labeledItems ? Math.round((labeledItems / totalItems) * 100) : 0
      
            return {
              ...dbProject,
              progress,
              teamMembers,
              totalItems: totalItems || 0,
              labeledItems: labeledItems || 0
            }
          } catch (err: any) {
            console.error(`Error transforming project ${dbProject.id}:`, err)
            throw new Error(`Failed to transform project ${dbProject.id}: ${err.message}`)
          }
        })
      )

      setProjects(transformedProjects)
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      setError(error.message || 'An error occurred while fetching projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and organize your labeling projects</p>
          </div>
          <button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <h3 className="text-lg font-medium">Error</h3>
            <p className="mt-1">{error}</p>
            <button
              onClick={fetchProjects}
              className="mt-4 rounded bg-red-100 px-4 py-2 hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-white px-3 py-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="flex-1 border-none text-sm focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg border bg-white p-6">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
                <div className="mt-4 h-2 rounded bg-gray-200" />
              </div>
            ))
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              {error ? 'Error loading projects' : 'No projects found'}
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="rounded-lg border bg-white shadow-sm flex flex-col h-[360px]">
                {/* Top content area */}
                <div className="p-6 flex flex-col h-full">
                  {/* Header section */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-green-600"
                      >
                        {project.name}
                      </Link>
                      <div className="mt-1 h-14 overflow-y-auto">
                        <p className="text-sm text-gray-500">
                          {project.description || "No description provided"}
                        </p>
                      </div>
                    </div>
                    <button className="rounded p-1 hover:bg-gray-100 ml-4">
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Bottom section */}
                  <div className="mt-auto flex flex-col gap-3">
                    {/* Status and Type */}
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                        ${project.status === 'In Progress' ? 'bg-green-100 text-green-700' : 
                          project.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'}`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs text-gray-500">{project.type}</span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        {/* <span>{project.progress}%</span> */}
                        <span>50%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-green-600"
                          // style={{ width: `${project.progress}%` }}
                          style={{ width: `50%` }}
                        />
                      </div>
                    </div>

                    {/* Project Stats */}
                    <div className="grid grid-cols-3 gap-4 border-t pt-3">
                      <div>
                        <p className="text-xs text-gray-500">Team</p>
                        <div className="mt-1 flex -space-x-2">
                          {project.teamMembers.map((member, index) => (
                            <div
                              key={index}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium"
                              title={member}
                            >
                              {member.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Labels</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {project.labeledItems}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Files</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {project.totalItems}
                        </p>
                      </div>
                      {/* <div>
                        <p className="text-xs text-gray-500">Updated</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div> */}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/projects/${project.id}/label`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                    >
                      <FileText className="h-4 w-4" />
                      Label Data
                    </Link>
                    <button className="rounded-md p-2 hover:bg-gray-100">
                      <Users className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="rounded-md p-2 hover:bg-gray-100">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Project Modal */}
        <NewProjectModal 
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onProjectCreated={fetchProjects}
        />
      </div>
    </MainLayout>
  )
}