'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MainLayout from '@/components/layout/MainLayout'
import TextLabeler from '@/components/labeling/TextLabeler'
import { Upload } from 'lucide-react'
import { Label, LabelType } from '@/types/project'

// Define supported file types
const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.json']

// Define default label types
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
  const params = useParams()
  const projectId = Number(params.projectId)

  const [currentText, setCurrentText] = useState('')
  const [currentFileId, setCurrentFileId] = useState<number | null>(null)
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

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Authentication error:', userError)
        setError('Authentication failed. Please sign in.')
        return
      }
      
      if (!user) {
        setError('No authenticated user found')
        return
      }

      console.log('Current project ID:', projectId)
      if (!projectId) {
        setError('No project ID found')
        return
      }

      // Read file content
      const text = await file.text()
      console.log('File content length:', text.length)
      
      try {
        // Save file to Supabase
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            project_id: projectId,
            content: text,
            file_name: file.name,
            file_type: fileExtension.slice(1), // Remove the dot
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (fileError) {
          console.error('Supabase file insert error:', fileError)
          setError(`Database error: ${fileError.message}`)
          return
        }

        if (!fileData) {
          setError('File was uploaded but no data was returned')
          return
        }

        console.log('File uploaded successfully:', fileData.id)

        // Log user activity
        const { error: activityError } = await supabase
          .from('user_activities')
          .insert({
            project_id: projectId,
            user_id: user.id,
            activity_type: 'file_upload',
            created_at: new Date().toISOString()
          })

        if (activityError) {
          console.error('Activity logging error:', activityError)
          // Don't return here, as the file upload was successful
        }

        setCurrentFileId(fileData.id)
        setCurrentText(text)
      } catch (dbError) {
        console.error('Database operation error:', dbError)
        setError('Failed to save file to database')
        return
      }

    } catch (err) {
      console.error('Unexpected error during file upload:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error during file upload')
    }
  }

  const handleCreateLabel = useCallback(async (
    labelTypeId: number,
    startOffset: number,
    endOffset: number,
    value: string
  ) => {
    if (!currentFileId) {
      console.error('No file ID available')
      return
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      // Insert label into Supabase
      const { data: labelData, error: labelError } = await supabase
        .from('labels')
        .insert({
          file_id: currentFileId,
          label_type_id: labelTypeId,
          start_offset: startOffset,
          end_offset: endOffset,
          value: value,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (labelError) {
        throw labelError
      }

      // Log user activity
      await supabase
        .from('user_activities')
        .insert({
          project_id: projectId,
          user_id: user.id,
          activity_type: 'create_label',
          created_at: new Date().toISOString()
        })

      setLabels(prevLabels => [...prevLabels, labelData])
    } catch (error) {
      console.error('Error creating label:', error)
      setError('Error saving label to database')
    }
  }, [currentFileId, projectId])

  const handleSaveLabels = useCallback(async (labels: Label[]) => {
    if (!currentFileId) {
      console.error('No file ID available')
      return
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      // Update all labels in Supabase
      const { error: updateError } = await supabase
        .from('labels')
        .upsert(
          labels.map(label => ({
            ...label,
            file_id: currentFileId,
            updated_at: new Date().toISOString()
          }))
        )

      if (updateError) {
        throw updateError
      }

      // Log user activity
      await supabase
        .from('user_activities')
        .insert({
          project_id: projectId,
          user_id: user.id,
          activity_type: 'save_labels',
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error saving labels:', error)
      setError('Error saving labels to database')
    }
  }, [currentFileId, projectId])

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

        {!currentText ? (
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