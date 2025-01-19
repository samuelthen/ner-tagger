'use client'

import { useParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import TextLabeler from '@/components/labeling/TextLabeler'
import { useLabels } from '@/hooks/useLabels'
import { useFiles } from '@/hooks/useFiles'
import MainLayout from '@/components/layout/MainLayout'
import { Label } from '@/types/project'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'

// Define supported file types
const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.json']

export default function LabelingPage() {
    const params = useParams()
    const projectId = params.projectId as string
    
    const { files, loading: filesLoading, error: filesError } = useFiles(projectId)
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [uploadedText, setUploadedText] = useState<string>('')
    const [error, setError] = useState<string>('')
    
    const currentFile = files[currentFileIndex]
    const { 
        labels, 
        createLabel,
        loading: labelsLoading,
        error: labelsError 
    } = useLabels(currentFile?.id?.toString() ?? '')

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setError('');
            const file = event.target.files?.[0];
            
            if (!file) {
                setError('No file selected');
                return;
            }

            const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
            if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
                setError(`Unsupported file type. Please upload ${SUPPORTED_EXTENSIONS.join(', ')} files.`);
                return;
            }

            // Create a FileReader
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                const content = e.target?.result;
                if (typeof content === 'string') {
                    setUploadedText(content);
                } else {
                    setError('Error reading file content');
                }
            };

            reader.onerror = () => {
                setError('Error reading file');
            };

            // Read the file
            reader.readAsText(file);

        } catch (err) {
            setError('Error processing file');
            console.error('File upload error:', err);
        }
    };

    const handleCreateLabel = useCallback(async (
        type: string,
        start: number,
        end: number,
        value: string
    ) => {
        try {
            await createLabel(
                type,
                start,
                end,
                value
            )
        } catch (error) {
            console.error('Error creating label:', error)
        }
    }, [createLabel])

    const handleSaveLabels = useCallback(async (labels: Label[]) => {
        console.log('Save labels:', labels)
    }, [])

    if (filesLoading || labelsLoading) {
        return (
            <MainLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </MainLayout>
        )
    }

    const showPlaceholder = !uploadedText && !currentFile?.text_content;

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
                            text={uploadedText || currentFile?.text_content || ''}
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