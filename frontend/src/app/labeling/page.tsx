'use client'

import { useState, useCallback } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import TextLabeler from '@/components/labeling/TextLabeler'
import { Upload } from 'lucide-react'
import { Label, LabelType } from '@/types/project'

// Define supported file types
const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.json']

// Default label types (you might want to fetch these from your backend)
const DEFAULT_LABEL_TYPES: LabelType[] = [
  { 
    id: 1, 
    project_id: 1, 
    key: 'PER', 
    name: 'Person', 
    color: '#EF4444', 
    hotkey: '1', 
    description: 'Person entities like names of people',
    created_at: new Date().toISOString() 
  },
  { 
    id: 2, 
    project_id: 1, 
    key: 'ORG', 
    name: 'Organization', 
    color: '#3B82F6', 
    hotkey: '2', 
    description: 'Organization entities like companies and institutions',
    created_at: new Date().toISOString() 
  },
  { 
    id: 3, 
    project_id: 1, 
    key: 'LOC', 
    name: 'Location', 
    color: '#10B981', 
    hotkey: '3', 
    description: 'Location entities like cities and countries',
    created_at: new Date().toISOString() 
  },
  { 
    id: 4, 
    project_id: 1, 
    key: 'GEO', 
    name: 'Geopolitical', 
    color: '#F59E0B', 
    hotkey: '4', 
    description: 'Geopolitical entities like governments and agencies',
    created_at: new Date().toISOString() 
  },
  { 
    id: 5, 
    project_id: 1, 
    key: 'DAT', 
    name: 'Date', 
    color: '#8B5CF6', 
    hotkey: '5', 
    description: 'Date and time expressions',
    created_at: new Date().toISOString() 
  },
]

export default function LabelingPage() {
  const [currentText, setCurrentText] = useState('')
  const [error, setError] = useState('')
  const [labels, setLabels] = useState<Label[]>([])
  const [labelTypes] = useState<LabelType[]>(DEFAULT_LABEL_TYPES)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('')
      const file = event.target.files?.[0]
      if (!file) {
        setError('No file selected')
        return
      }

      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
      if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        setError(`Unsupported file type. Please upload ${SUPPORTED_EXTENSIONS.join(', ')} files.`)
        return
      }

      // Read file content
      const text = await file.text()
      setCurrentText(text)
    } catch (err) {
      setError('Error processing file')
      console.error('File upload error:', err)
    }
  }

  const handleCreateLabel = useCallback(async (
    labelTypeId: number,
    startOffset: number,
    endOffset: number,
    value: string
  ) => {
    try {
      // Create a new label
      const newLabel: Label = {
        id: Date.now(), // Temporary numeric ID
        file_id: 0,
        label_type_id: labelTypeId,
        start_offset: startOffset,
        end_offset: endOffset,
        value,
        created_by: 'user', // Should be replaced with actual user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setLabels(prevLabels => [...prevLabels, newLabel])
    } catch (error) {
      console.error('Error creating label:', error)
    }
  }, [])

  const handleSaveLabels = useCallback(async (labels: Label[]) => {
    // Here you would typically save the labels to your backend
    console.log('Saving labels:', labels)
  }, [])

  const showPlaceholder = !currentText

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-64px)] flex-col">
        {/* File upload toolbar */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-2">
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
              <Upload className="h-4 w-4" />
              Upload Files
              <input
                type="file"
                className="hidden"
                accept={SUPPORTED_EXTENSIONS.join(',')}
                onChange={handleFileUpload}
              />
            </label>
            {error && (
              <span className="text-sm text-red-600">
                {error}
              </span>
            )}
          </div>
        </div>

        {showPlaceholder ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center text-gray-500">
              <Upload className="mx-auto h-12 w-12" />
              <p className="mt-2">Upload a file to start labeling</p>
              <p className="text-sm">Supports {SUPPORTED_EXTENSIONS.join(', ')} files</p>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <TextLabeler
              text={currentText}
              initialLabels={labels}
              labelTypes={labelTypes}
              onCreateLabel={handleCreateLabel}
              onSaveLabels={handleSaveLabels}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}