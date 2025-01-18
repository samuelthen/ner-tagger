'use client'

import { useParams } from 'next/navigation'
import TextLabeler from '@/components/labeling/TextLabeler'
import { useLabels } from '@/hooks/useLabels'
import { useFiles } from '@/hooks/useFiles'
import MainLayout from '@/components/layout/MainLayout'

export default function LabelingPage() {
    const params = useParams()
    const projectId = params.projectId as string
    
    const { files, loading: filesLoading, error: filesError } = useFiles(projectId)
    const { labels, createLabel } = useLabels(files[0]?.id?.toString()) // Convert to string if needed

    if (filesLoading) {
        return <div>Loading...</div>
    }

    if (filesError) {
        return <div>Error loading files: {filesError.message}</div>
    }

    return (
        <MainLayout>
            <div className="h-screen">
                <TextLabeler 
                    text={files[0]?.text_content || ''} // Changed from content to text_content
                    initialLabels={labels}
                    onCreateLabel={createLabel}
                />
            </div>
        </MainLayout>
    )
}