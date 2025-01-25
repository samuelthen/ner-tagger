import { Label } from "@/types/project"
import { supabase } from "@/lib/supabase"
import { useEffect, useState, useCallback } from "react"

export function useLabels(fileId: string | null) {
    const [labels, setLabels] = useState<Label[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchLabels = useCallback(async () => {
        if (!fileId) {
            setLabels([])
            setLoading(false)
            return
        }

        const numericFileId = parseInt(fileId)
        if (isNaN(numericFileId)) {
            setLabels([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('labels')
                .select('*')
                .eq('file_id', numericFileId)

            if (error) throw error
            setLabels(data || [])
        } catch (e) {
            setError(e as Error)
        } finally {
            setLoading(false)
        }
    }, [fileId])

    useEffect(() => {
        fetchLabels()
    }, [fetchLabels])

    const createLabel = async (labelTypeId: number, startOffset: number, endOffset: number, value: string) => {
        if (!fileId) throw new Error('No file ID provided')
        
        const numericFileId = parseInt(fileId)
        if (isNaN(numericFileId)) throw new Error('Invalid file ID')

        try {
            const timestamp = new Date().toISOString()
            const { data, error } = await supabase
                .from('labels')
                .insert([{
                    file_id: numericFileId,
                    label_type_id: labelTypeId,
                    start_offset: startOffset,
                    end_offset: endOffset,
                    value,
                    created_at: timestamp,
                    updated_at: timestamp
                }])
                .select()
                .single()

            if (error) throw error
            setLabels(prev => [...prev, data])
            return data
        } catch (e) {
            throw e
        }
    }

    return { labels, loading, error, createLabel }
}