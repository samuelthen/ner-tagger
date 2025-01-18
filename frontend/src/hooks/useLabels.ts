import { Label } from "@/types/project"
import { supabase } from "@/lib/supabase"
import { useEffect, useState, useCallback } from "react"

export function useLabels(fileId: string) {
    const [labels, setLabels] = useState<Label[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchLabels = useCallback(async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('labels')
                .select('*')
                .eq('file_id', fileId)

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

    const createLabel = async (type: string, startOffset: number, endOffset: number, value: string) => {
        try {
            const { data, error } = await supabase
                .from('labels')
                .insert([{
                    file_id: fileId,
                    type,
                    start: startOffset,
                    end: endOffset,
                    value
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