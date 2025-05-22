// src/app/dashboard/page.tsx
'use client'

import { useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, Download, RefreshCw } from 'lucide-react'

// Mock data with different metrics
const labelingProgressData = [
  { name: 'Verified', value: 458, percentage: '45.8%', color: '#22C55E' },
  { name: 'In Review', value: 234, percentage: '23.4%', color: '#3B82F6' },
  { name: 'Pending', value: 189, percentage: '18.9%', color: '#EAB308' },
  { name: 'Rejected', value: 119, percentage: '11.9%', color: '#EF4444' },
]

const dailyProductivityData = [
  { date: 'Mon', images: 145, text: 89, audio: 34 },
  { date: 'Tue', images: 165, text: 96, audio: 41 },
  { date: 'Wed', images: 189, text: 102, audio: 45 },
  { date: 'Thu', images: 158, text: 91, audio: 38 },
  { date: 'Fri', images: 172, text: 98, audio: 43 },
]

const accuracyTrendData = [
  { date: 'Week 1', accuracy: 0.89, speed: 45 },
  { date: 'Week 2', accuracy: 0.92, speed: 52 },
  { date: 'Week 3', accuracy: 0.91, speed: 58 },
  { date: 'Week 4', accuracy: 0.94, speed: 61 },
]

const teamPerformanceData = [
  { member: 'Team A', tasks: 234, accuracy: 0.95 },
  { member: 'Team B', tasks: 189, accuracy: 0.92 },
  { member: 'Team C', tasks: 167, accuracy: 0.88 },
  { member: 'Team D', tasks: 145, accuracy: 0.91 },
]

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('This Month')

  return (
    <MainLayout>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-70 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Under Construction</h1>
            <p className="mt-2 text-gray-600">We're working hard to bring this dashboard to life. Stay tuned!</p>
          </div>
        </div>

        <div className="space-y-6 opacity-50 pointer-events-none">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Track your team's labeling performance and productivity</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="text-sm font-medium text-gray-600 focus:outline-none"
                >
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Quarter</option>
                  <option>This Year</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Labeling Progress</h2>
                  <p className="text-sm text-gray-500">Total items: 1,000</p>
                </div>
                <button className="rounded-lg p-2 hover:bg-gray-50">
                  <Download className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={labelingProgressData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {labelingProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Daily Productivity</h2>
                  <p className="text-sm text-gray-500">Items labeled per data type</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="images" stackId="a" fill="#3B82F6" name="Images" />
                    <Bar dataKey="text" stackId="a" fill="#22C55E" name="Text" />
                    <Bar dataKey="audio" stackId="a" fill="#EAB308" name="Audio" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="font-semibold text-gray-900">Quality Metrics</h2>
                <p className="text-sm text-gray-500">Accuracy and speed over time</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" domain={[0.8, 1]} tickFormatter={val => `${(val * 100).toFixed(0)}%`} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#3B82F6" name="Accuracy" />
                    <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#22C55E" name="Speed (items/hour)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="font-semibold text-gray-900">Team Performance</h2>
                <p className="text-sm text-gray-500">Tasks completed and accuracy by team</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" />
                    <YAxis dataKey="member" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tasks" fill="#3B82F6" name="Tasks Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
