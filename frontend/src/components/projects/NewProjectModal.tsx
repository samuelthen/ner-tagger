// src/components/projects/NewProjectModal.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated?: () => void
}

export default function NewProjectModal({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}: NewProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NER'
  })

  if (!isOpen) return null

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'NER'
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    try {
      setLoading(true)

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error('Authentication error: ' + userError.message)
      }

      if (!user) {
        throw new Error('You must be logged in to create a project')
      }

      console.log('Creating project with data:', {
        ...formData,
        created_by: user.id,
        status: 'Created'
      })

      // Insert new project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: formData.name,
          description: formData.description,
          type: formData.type,
          status: 'Created',
          created_by: user.id
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

      console.log('Project created successfully:', project)

      // Add creator to user_activities
      const { error: activityError } = await supabase
        .from('user_activities')
        .insert([{
          project_id: project.id,
          user_id: user.id,
          activity_type: 'creator'
        }])

      if (activityError) {
        console.error('Error adding user activity:', activityError)
        // Don't throw here, as the project was created successfully
      }

      // Reset form and close modal
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
          Create a new labeling project. You can add team members and data files later.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-black">
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

          <div>
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
          </div>

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
              disabled={loading}
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