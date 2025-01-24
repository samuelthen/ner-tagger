// src/types/project.ts

export interface Project {
  id: number
  name: string
  description: string | null
  status: project_status
  type: project_type
  progress: number
  created_at: string
  updated_at: string
  created_by: string
}

// Custom type for project status based on schema
type project_status = string // This should match your Supabase enum

// Custom type for project type based on schema
type project_type = string // This should match your Supabase enum

export interface File {
  id: number
  project_id: number
  content: string
  file_name: string
  file_type: string
  created_at: string
  updated_at: string
}

export interface Label {
  id: number
  file_id: number
  label_type_id: number
  start_offset: number
  end_offset: number
  value: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface LabelType {
  id: number
  project_id: number
  key: string
  name: string
  color: string
  hotkey: string
  description: string | null
  created_at: string
}

// If you need a type that includes related data
export interface ProjectWithRelations extends Project {
  files?: File[]
  label_types?: LabelType[]
}

export interface FileWithLabels extends File {
  labels?: Label[]
}

export interface LabelWithType extends Label {
  label_type?: LabelType
}