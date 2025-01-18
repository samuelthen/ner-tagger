'use client'

import { useState, useEffect, useCallback, JSX } from 'react'

import { Label } from '@/types/project'

interface EntityType {
  key: string
  name: string
  color: string
  hotkey: string
}

const entityTypes: EntityType[] = [
  { key: 'PER', name: 'Person', color: '#EF4444', hotkey: '1' },
  { key: 'ORG', name: 'Organization', color: '#3B82F6', hotkey: '2' },
  { key: 'LOC', name: 'Location', color: '#10B981', hotkey: '3' },
  { key: 'GEO', name: 'Geopolitical', color: '#F59E0B', hotkey: '4' },
  { key: 'DAT', name: 'Date', color: '#8B5CF6', hotkey: '5' },
]
interface TextLabelerProps {
  text: string
  initialLabels?: Label[]  // Using the Label type from your types
  onCreateLabel?: (type: string, start: number, end: number, value: string) => Promise<void>
}

interface SelectionState {
  text: string
  start: number
  end: number
}

export default function TextLabeler({ 
  text: initialText, 
  initialLabels = [], 
  onCreateLabel 
}: TextLabelerProps) {
  const [text, setText] = useState<string>(initialText)
  const [labels, setLabels] = useState<Label[]>(initialLabels)
  const [selectedText, setSelectedText] = useState<SelectionState | null>(null)
  const [selectedEntityType, setSelectedEntityType] = useState<string>('')

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedText(null)
      return
    }

    const range = selection.getRangeAt(0)
    const start = range.startOffset
    const end = range.endOffset
    const text = selection.toString()

    if (text.trim()) {
      setSelectedText({ text, start, end })
    }
  }

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const entityType = entityTypes.find(type => type.hotkey === e.key)
    if (entityType && selectedText) {
      addLabel(entityType.key)
    }
  }, [selectedText])

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress)
    return () => document.removeEventListener('keypress', handleKeyPress)
  }, [handleKeyPress])

  // Add a new label
  const addLabel = async (entityTypeKey: string) => {
    if (!selectedText) return

    try {
      if (onCreateLabel) {
        await onCreateLabel(
          entityTypeKey,
          selectedText.start,
          selectedText.end,
          selectedText.text // this will be the value field in the database
        )
      }

      const newLabel: Label = {
        id: Date.now().toString(), // temporary ID until DB assigns one
        file_id: 0, // this will be set by the backend
        type: entityTypeKey,
        start: selectedText.start,
        end: selectedText.end,
        value: selectedText.text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      setLabels([...labels, newLabel])
      setSelectedText(null)
      window.getSelection()?.removeAllRanges()
    } catch (error) {
      console.error('Error adding label:', error)
    }
  }
  // Remove a label
  const removeLabel = (labelId: string) => {
    setLabels(labels.filter(label => label.id !== labelId))
  }

  // Render text with highlighted labels
  const renderText = () => {
    if (!text) return null

    // Sort labels by start position
    const sortedLabels = [...labels].sort((a, b) => a.start - b.start)

    let lastIndex = 0
    const elements: JSX.Element[] = []

    sortedLabels.forEach((label, index) => {
      // Add non-labeled text before this label
      if (label.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, label.start)}
          </span>
        )
      }

      // Add the labeled text
      const entityType = entityTypes.find(type => type.key === label.type)
      elements.push(
        <span
          key={label.id}
          style={{ backgroundColor: entityType?.color + '40' }}
          className="relative group cursor-pointer rounded px-1"
        >
          {text.slice(label.start, label.end)}
          <span className="absolute -top-5 left-0 hidden bg-gray-800 px-2 py-1 text-xs text-white rounded group-hover:block">
            {entityType?.name}
            <button 
              onClick={() => removeLabel(label.id)}
              className="ml-2 hover:text-red-300"
            >
              ×
            </button>
          </span>
        </span>
      )
      lastIndex = label.end
    })

    // Add any remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      )
    }

    return elements
  }

  return (
    <div className="flex h-full">
      {/* Text area */}
      <div className="flex-1 p-6">
        <div
          className="min-h-[200px] rounded-lg border bg-white p-4 text-gray-800 shadow-sm"
          onMouseUp={handleTextSelection}
        >
          {renderText() || (
            <div className="text-gray-400">
              No text to label. Upload a file or paste text to begin.
            </div>
          )}
        </div>
      </div>

      {/* Label controls */}
      <div className="w-64 border-l bg-white p-4">
        <h3 className="mb-4 font-medium text-gray-900">Entity Types</h3>
        <div className="space-y-2">
          {entityTypes.map((entityType) => (
            <button
              key={entityType.key}
              onClick={() => {
                setSelectedEntityType(entityType.key)
                if (selectedText) {
                  addLabel(entityType.key)
                }
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                selectedEntityType === entityType.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entityType.color }}
                />
                {entityType.name}
              </div>
              <span className="text-xs text-gray-500">{entityType.hotkey}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="mb-2 font-medium text-gray-900">Keyboard Shortcuts</h3>
          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <p className="text-gray-500">Select text and press the number key to apply the corresponding label.</p>
          </div>
        </div>
      </div>
    </div>
  )
}