'use client'

import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Upload, Trash2, Tag, FileText, Download, ExternalLink } from 'lucide-react'

const datasetsData = [
  {
    id: 1,
    name: 'Medical Reports NER',
    type: 'Text',
    files: 1500,
    totalTokens: '2.1M',
    status: 'In Progress',
    progress: 45,
    lastUpdated: '2024-01-15',
    entityTypes: ['Disease', 'Treatment', 'Drug', 'Test', 'Symptom'],
    language: 'English',
    source: 'Internal Medical Records',
    description: 'Named entity recognition dataset for medical domain focusing on diseases, treatments, and symptoms identification.'
  },
  {
    id: 2,
    name: 'Financial Terms Classification',
    type: 'Text',
    files: 3200,
    totalTokens: '4.5M',
    status: 'Completed',
    progress: 100,
    lastUpdated: '2024-01-10',
    entityTypes: ['Company', 'Currency', 'Amount', 'Transaction', 'Financial Metric'],
    language: 'English',
    source: 'Financial Reports',
    description: 'Financial entity recognition dataset built from annual reports and financial news articles.'
  },
  {
    id: 3,
    name: 'Legal Document Entities',
    type: 'Text',
    files: 2800,
    totalTokens: '5.2M',
    status: 'In Progress',
    progress: 68,
    lastUpdated: '2024-01-08',
    entityTypes: ['Person', 'Organization', 'Date', 'Law', 'Court', 'Case Number'],
    language: 'English',
    source: 'Law Firm Database',
    description: 'Legal document dataset for identifying key entities in contracts, court documents, and legal opinions.'
  },
  {
    id: 4,
    name: 'Product Reviews Intent',
    type: 'Text',
    files: 5000,
    totalTokens: '1.8M',
    status: 'Not Started',
    progress: 0,
    lastUpdated: '2024-01-05',
    entityTypes: ['Product', 'Feature', 'Issue', 'Sentiment', 'Action Required'],
    language: 'English',
    source: 'E-commerce Reviews',
    description: 'Customer review dataset for identifying product features, issues, and sentiment analysis.'
  },
  {
    id: 5,
    name: 'Technical Support Queries',
    type: 'Text',
    files: 4200,
    totalTokens: '3.3M',
    status: 'In Progress',
    progress: 32,
    lastUpdated: '2024-01-12',
    entityTypes: ['Product', 'Error', 'Solution', 'Component', 'Action'],
    language: 'English',
    source: 'Support Tickets',
    description: 'IT support ticket dataset for identifying technical issues, products, and resolution steps.'
  }
]

export default function DatasetsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')

  const filteredDatasets = datasetsData.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'All' || dataset.status === selectedStatus
    const matchesLanguage = selectedLanguage === 'All' || dataset.language === selectedLanguage
    return matchesSearch && matchesStatus && matchesLanguage
  })

  return (
    <MainLayout>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Under Construction</h1>
            <p className="mt-2 text-gray-600">We're working hard to bring this dashboard to life. Stay tuned!</p>
          </div>
        </div>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">NLP Datasets</h1>
            <p className="mt-1 text-sm text-gray-500">Domain-specific datasets for NER and text classification</p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50">
              <FileText className="h-4 w-4" />
              Import from File
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Upload className="h-4 w-4" />
              Upload Text Data
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by dataset name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option>All</option>
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option>All</option>
            <option>English</option>
            <option>Multiple</option>
          </select>
        </div>

        {/* Datasets Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredDatasets.map((dataset) => (
            <div key={dataset.id} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{dataset.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{dataset.description}</p>
                </div>
                <div className="flex items-start gap-2">
                  <button className="rounded p-1.5 hover:bg-gray-100">
                    <Download className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="rounded p-1.5 hover:bg-gray-100">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4">
                <div>
                  <div className="text-sm text-gray-500">Files</div>
                  <div className="font-medium text-black">{dataset.files.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Tokens</div>
                  <div className="font-medium text-black">{dataset.totalTokens}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Language</div>
                  <div className="font-medium text-black">{dataset.language}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    dataset.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    dataset.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {dataset.status}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-500">Entity Types</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dataset.entityTypes.map((type) => (
                    <span 
                      key={type}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Progress</div>
                  <div className="text-sm font-medium">{dataset.progress}%</div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div 
                    className="h-2 rounded-full bg-blue-600" 
                    style={{ width: `${dataset.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>  
    </MainLayout>
  )
}