'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import NewProjectModal from '@/components/projects/NewProjectModal'
import { Plus, Search, Filter, MoreVertical, FileText, Users, Calendar } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

interface Project {
  id: string;
  name: string;
  description: string;
  team_id: string;
  created_at: string;
  teamName: string;
  teamMembers: string[];
  totalItems: number;
}

export default function ProjectsPage() {
  const router = useRouter()
  const { isInitialized, isAuthenticated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    console.log('[Projects] Auth state:', {
      isInitialized,
      isAuthenticated,
      hasUser: !!user
    })

    if (isInitialized && !isAuthenticated) {
      console.log('[Projects] No auth, redirecting to login')
      router.push('/login?redirect=/projects')
      return
    }
  }, [isInitialized, isAuthenticated, user, router])

  // Fetch projects only when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProjects()
    }
  }, [isAuthenticated, user])

  const fetchProjects = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const projectsData = await response.json()
      setProjects(projectsData)
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
              <div key={project.id} className="rounded-lg border bg-white shadow-sm">
                <div className="p-6">
                  {/* Project Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <Link 
                        href={`/projects/${project.id}`}
                        className="text-lg font-medium text-gray-900 hover:text-green-600"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Team: {project.teamName}
                      </p>
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

                  {/* Team Members */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Team Members</h4>
                      <span className="text-sm text-gray-500">
                        {project.teamMembers.length} members
                      </span>
                    </div>
                    <div className="mt-2 flex -space-x-2">
                      {project.teamMembers.slice(0, 5).map((member, index) => (
                        <div
                          key={index}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium"
                          title={member}
                        >
                          {member.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {project.teamMembers.length > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-600">
                          +{project.teamMembers.length - 5}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-3">
                    <div>
                      <p className="text-xs text-gray-500">Files</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {project.totalItems}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t px-6 py-4">
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