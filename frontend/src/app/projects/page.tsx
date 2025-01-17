'use client'

import { useState } from 'react'
import Link from 'next/link'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Search, Filter, MoreVertical, FileText, Users, Calendar } from 'lucide-react'

// Mock project data
const projectsData = [
  {
    id: 1,
    name: 'Customer Support NER',
    description: 'Named Entity Recognition for customer support tickets',
    status: 'In Progress',
    type: 'NER',
    progress: 65,
    team: ['John D.', 'Sarah M.', 'Mike R.'],
    created: '2024-01-15',
    updated: '2024-01-18',
    totalItems: 1250,
    labeledItems: 815
  },
  {
    id: 2,
    name: 'Product Review Classification',
    description: 'Sentiment analysis for product reviews',
    status: 'Created',
    type: 'Classification',
    progress: 0,
    team: ['Anna K.', 'Tom B.'],
    created: '2024-01-17',
    updated: '2024-01-17',
    totalItems: 2500,
    labeledItems: 0
  },
  // Add more projects as needed
]

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and organize your labeling projects</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

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
          {projectsData.map((project) => (
            <div key={project.id} className="rounded-lg border bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Link 
                      href={`/projects/${project.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-green-600"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 text-sm text-gray-500">{project.description}</p>
                  </div>
                  <button className="rounded p-1 hover:bg-gray-100">
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${project.status === 'In Progress' ? 'bg-green-100 text-green-700' :
                      project.status === 'Created' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs text-gray-500">{project.type}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Project stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Team</p>
                    <div className="mt-1 flex -space-x-2">
                      {project.team.map((member, index) => (
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
                    <p className="text-xs text-gray-500">Items</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {project.labeledItems} / {project.totalItems}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Updated</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {new Date(project.updated).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/labeling/${project.id}`}
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
          ))}
        </div>
      </div>
    </MainLayout>
  )
}