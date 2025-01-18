// src/types/project.ts
export interface Project {
    id: number
    name: string
    description: string
    status: 'Created' | 'In Progress' | 'Completed'
    type: 'NER' | 'Classification' | 'Sentiment'
    progress: number
    team: string[]
    created: string
    updated: string
    totalItems: number
    labeledItems: number
    labelTypes?: LabelType[]
  }
  
  export interface LabelType {
    key: string
    name: string
    color: string
    hotkey: string
    description?: string
  }
  
  export interface LabeledItem {
    id: number
    text: string
    labels: Array<{
      type: string
      start: number
      end: number
      value: string
    }>
  }

  export interface File {
    id: number
    project_id: number
    name: string
    text_content: string  // Changed from content to match DB
    created_at: string
    updated_at: string
  }
  
  export interface Label {
    id: string // Changed to string to match component
    file_id: number
    type: string
    start: number
    end: number
    value: string
    created_at: string
    updated_at: string
  }