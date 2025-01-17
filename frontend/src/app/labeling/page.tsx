'use client'

import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Upload, Search, Settings, ChevronRight, ChevronLeft, Save } from 'lucide-react'

// Define supported file types
const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.json']

// NER label types
const labelTypes = [
  { key: 'PER', name: 'Person', color: '#EF4444', hotkey: '1' },
  { key: 'ORG', name: 'Organization', color: '#3B82F6', hotkey: '2' },
  { key: 'LOC', name: 'Location', color: '#10B981', hotkey: '3' },
  { key: 'GEO', name: 'Geopolitical', color: '#F59E0B', hotkey: '4' },
  { key: 'DAT', name: 'Date', color: '#8B5CF6', hotkey: '5' },
]

export default function LabelingPage() {
  const [currentText, setCurrentText] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')
  const [currentIndex, setCurrentIndex] = useState(1)
  const [totalItems, setTotalItems] = useState(4)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
      alert('Unsupported file type. Please upload .txt, .csv, or .json files.')
      return
    }

    // Read file content
    const text = await file.text()
    setCurrentText(text)
  }

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
            <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search in files..."
                className="w-64 border-none text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-md p-1.5 hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <button className="rounded-md p-1 hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span>{currentIndex} of {totalItems}</span>
              <button className="rounded-md p-1 hover:bg-gray-100">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
              <Save className="h-4 w-4" />
              Save Labels
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1">
          {/* Text content */}
          <div className="flex-1 overflow-auto p-6">
            {currentText ? (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <p className="whitespace-pre-wrap text-gray-800">{currentText}</p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center text-gray-500">
                  <Upload className="mx-auto h-12 w-12" />
                  <p className="mt-2">Upload a file to start labeling</p>
                  <p className="text-sm">Supports .txt, .csv, and .json files</p>
                </div>
              </div>
            )}
          </div>

          {/* Labels sidebar */}
          <div className="w-64 border-l bg-white p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Named Entity Recognition</h3>
              <div className="space-y-2">
                {labelTypes.map((label) => (
                  <button
                    key={label.key}
                    onClick={() => setSelectedLabel(label.key)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                      selectedLabel === label.key
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </div>
                    <span className="text-xs text-gray-500">{label.hotkey}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <h3 className="font-semibold text-gray-900">Search</h3>
                <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                  <Search className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search labels..."
                    className="w-full text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <h3 className="font-semibold text-gray-900">Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Search all files</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Regex search</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded text-blue-600" />
                    <span className="text-sm text-gray-700">Exact match</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}