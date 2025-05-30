'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import TextLabeler from '@/components/labeling/TextLabeler'
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLabels } from '@/hooks/useLabels'
import { useFiles } from '@/hooks/useFiles'
import { Label, LabelType } from '@/types/project'
import { supabase } from '@/lib/supabase'

// Define supported file types
const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.json']

// Define default label types - keep these as they're still needed initially
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
    const projectId = params.projectId as string
    
    const [uploadedText, setUploadedText] = useState<string>('')
    const [currentFileId, setCurrentFileId] = useState<string | null>(null)
    const [error, setError] = useState<string>('')
    const [dbLabelTypes, setDbLabelTypes] = useState<LabelType[]>([])
    const [currentFileIndex, setCurrentFileIndex] = useState(0)

    const { files, loading: filesLoading, error: filesError, fetchFiles } = useFiles(projectId)
    const { labels, loading: labelsLoading, error: labelsError } = useLabels(currentFileId ?? '')

    useEffect(() => {
      if (files && files.length > 0) {
        const file = files[currentFileIndex]
        setCurrentFileId(String(file.id))
        setUploadedText(file.content)
      }
    }, [files, currentFileIndex])

    const handlePreviousFile = () => {
      if (currentFileIndex > 0) setCurrentFileIndex(prev => prev - 1)
    }

    const handleNextFile = () => {
      if (currentFileIndex < files.length - 1) setCurrentFileIndex(prev => prev + 1)
    }

    useEffect(() => {
      const initializeLabelTypes = async () => {
        try {
          const { data: existingTypes, error: fetchError } = await supabase
            .from('label_types')
            .select('*')
            .eq('project_id', parseInt(projectId))

          if (fetchError) {
            console.error('Error fetching label types:', fetchError)
            return
          }

          if (existingTypes && existingTypes.length > 0) {
            console.log('Using existing label types:', existingTypes)
            setDbLabelTypes(existingTypes)
            return
          }

          const { data: insertedTypes, error: insertError } = await supabase
            .from('label_types')
            .insert(
              DEFAULT_LABEL_TYPES.map(type => ({
                project_id: parseInt(projectId),
                key: type.key,
                name: type.name,
                color: type.color,
                hotkey: type.hotkey,
                description: type.description,
                created_at: new Date().toISOString()
              }))
            )
            .select()

          if (insertError) {
            console.error('Error inserting label types:', insertError)
            return
          }

          if (insertedTypes) {
            console.log('Created new label types:', insertedTypes)
            setDbLabelTypes(insertedTypes)
          }
        } catch (error) {
          console.error('Error initializing label types:', error)
        }
      }

      initializeLabelTypes()
    }, [projectId])

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

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setError('Authentication required')
          return
        }

        const text = await file.text()
        
        try {
          const { data: insertedData, error: fileError } = await supabase
            .from('files')
            .insert({
              project_id: parseInt(projectId),
              content: text,
              file_name: file.name.substring(0, 255),
              file_type: fileExtension.slice(1).substring(0, 255),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (fileError) {
            console.error('Supabase file insert error:', {
              error: fileError,
              message: fileError.message,
              details: fileError.details,
              hint: fileError.hint
            })
            setError(`Database error: ${fileError.message || 'Unknown error'}`)
            return
          }

          if (!insertedData) {
            setError('File was uploaded but no data was returned')
            return
          }

          console.log('File uploaded successfully, ID:', insertedData.id)
          setCurrentFileId(String(insertedData.id))
          setUploadedText(text)
          
          const { error: activityError } = await supabase
            .from('user_activities')
            .insert({
              project_id: parseInt(projectId),
              user_id: user.id,
              activity_type: 'file_upload',
              created_at: new Date().toISOString()
            })

          if (activityError) {
            console.error('Activity logging error:', activityError)
          }

          fetchFiles()

        } catch (dbError) {
          console.error('Database operation error:', dbError)
          setError('Failed to save file to database')
        }

      } catch (err) {
        console.error('File upload error:', err)
        setError('Error processing file')
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
        setError('No file selected')
        return
      }

      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          throw new Error('Authentication required')
        }

        const timestamp = new Date().toISOString()
        
        const { data: labelData, error: labelError } = await supabase
          .from('labels')
          .insert({
            file_id: parseInt(currentFileId),
            label_type_id: labelTypeId,
            start_offset: startOffset,
            end_offset: endOffset,
            value: value,
            created_by: user.id,
            created_at: timestamp,
            updated_at: timestamp
          })
          .select()
          .single()

        if (labelError) {
          console.error('Label creation error:', {
            error: labelError,
            details: labelError.details,
            hint: labelError.hint,
            message: labelError.message
          })
          throw new Error(labelError.message || 'Failed to create label')
        }

        if (!labelData) {
          throw new Error('No data returned from label creation')
        }

        const { error: activityError } = await supabase
          .from('user_activities')
          .insert({
            project_id: parseInt(projectId),
            user_id: user.id,
            activity_type: 'create_label',
            created_at: timestamp
          })

        if (activityError) {
          console.error('Activity logging error:', activityError)
        }

        return labelData
      } catch (error) {
        console.error('Error creating label:', error)
        setError(error instanceof Error ? error.message : 'Failed to create label')
        throw error
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

        const { error: updateError } = await supabase
          .from('labels')
          .upsert(
            labels.map(label => ({
              ...label,
              file_id: parseInt(currentFileId),
              updated_at: new Date().toISOString()
            }))
          )

        if (updateError) {
          throw updateError
        }

        await supabase
          .from('user_activities')
          .insert({
            project_id: parseInt(projectId),
            user_id: user.id,
            activity_type: 'save_labels',
            created_at: new Date().toISOString()
          })

      } catch (error) {
        console.error('Error saving labels:', error)
        setError('Failed to save labels')
      }
    }, [currentFileId, projectId])

    if (filesLoading || labelsLoading) {
      return (
        <MainLayout>
          <div className="flex h-screen items-center justify-center">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </MainLayout>
      )
    }

    const showPlaceholder = files.length === 0 && !uploadedText

    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-64px)] flex-col">
          {/* Top toolbar */}
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
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
            
            {files.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePreviousFile}
                  disabled={currentFileIndex === 0}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" color="black" />
                </button>
                <span className="text-sm text-gray-600">
                  File {currentFileIndex + 1} of {files.length}
                </span>
                <button
                  onClick={handleNextFile}
                  disabled={currentFileIndex === files.length - 1}
                  className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" color="black" />
                </button>
              </div>
            )}
          </div>

          {/* Main content */}
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
                text={uploadedText || files[currentFileIndex]?.content || ''}
                initialLabels={labels}
                labelTypes={dbLabelTypes.length > 0 ? dbLabelTypes : DEFAULT_LABEL_TYPES}
                onCreateLabel={handleCreateLabel}
                onSaveLabels={handleSaveLabels}
                projectId={projectId}
                onLabelTypesUpdate={(updatedTypes) => setDbLabelTypes(updatedTypes)}
              />
            </div>
          )}
        </div>
      </MainLayout>
    )
}