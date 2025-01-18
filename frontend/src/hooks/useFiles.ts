import { File } from "@/types/project"
import { supabase } from "@/lib/supabase"
import { useState, useCallback, useEffect } from "react"

export function useFiles(projectId: string) {
    const [files, setFiles] = useState<File[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('files')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setFiles(data || [])
        } catch (e) {
            setError(e as Error)
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    const uploadFile = async (content: string, fileName: string) => {
        try {
            const { data, error } = await supabase
                .from('files')
                .insert([{
                    project_id: projectId,
                    name: fileName,
                    text_content: content  // Changed from content to text_content
                }])
                .select()
                .single()

            if (error) throw error
            setFiles(prev => [data, ...prev])
            return data
        } catch (e) {
            throw e
        }
    }

    return { files, loading, error, uploadFile, fetchFiles }
}