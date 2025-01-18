import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types/project'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }

  async function createProject(name: string, description?: string) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name, description }])
        .select()
        .single()

      if (error) throw error
      setProjects([data, ...projects])
      return data
    } catch (e) {
      setError(e as Error)
      throw e
    }
  }

  return { projects, loading, error, createProject, fetchProjects }
}