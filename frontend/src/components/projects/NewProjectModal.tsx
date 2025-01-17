'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NER',
    labels: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically make an API call to create the project
    // For now, we'll simulate it
    const projectId = Date.now() // Simulate a unique ID
    router.push(`/projects/${projectId}/label`)
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create New Project</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="e.g., Customer Support NER"
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              rows={3}
              placeholder="Brief description of your project"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Project Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="NER">Named Entity Recognition</option>
              <option value="Classification">Text Classification</option>
              <option value="Sentiment">Sentiment Analysis</option>
            </select>
          </div>

          {/* Label Set */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Label Set</label>
            <div className="mt-2 space-y-2">
              {formData.type === 'NER' && (
                <>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-900">Person (PER)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-900">Organization (ORG)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-900">Location (LOC)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-900">Date (DATE)</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Upload Data */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Upload Data</label>
            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-4">
              <div className="text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt,.csv,.json"
                  multiple
                  onChange={(e) => {
                    // Handle file upload
                    console.log(e.target.files)
                  }}
                />
                <button
                  type="button"
                  onClick={handleFileClick}
                  className="text-sm text-gray-900 hover:text-gray-900"
                >
                  Click to upload or drag and drop
                  <p className="text-xs text-gray-900">CSV, TXT, or JSON up to 10MB</p>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm text-gray-900 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}