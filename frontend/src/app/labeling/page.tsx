'use client'

import { useState, useCallback } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import TextLabeler from '@/components/labeling/TextLabeler'
import { Upload } from 'lucide-react'
import { Label } from '@/types/project'

// Define supported file types
const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.json']

export default function LabelingPage() {
  const [currentText, setCurrentText] = useState('')
  const [error, setError] = useState('')
  const [labels, setLabels] = useState<Label[]>([])

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
    type: string,
    start: number,
    end: number,
    value: string
  ) => {
    try {
      // Create a new label
      const newLabel: Label = {
        id: Date.now().toString(),
        file_id: 0,
        type,
        start,
        end,
        value,
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
              onCreateLabel={handleCreateLabel}
              onSaveLabels={handleSaveLabels}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}