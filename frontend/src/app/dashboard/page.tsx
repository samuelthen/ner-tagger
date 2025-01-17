'use client'

import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { BarChart2, Users, FileText, CheckCircle } from 'lucide-react'

const stats = [
  { name: 'Total Projects', value: '12', icon: FileText, change: '+2.5%', changeType: 'positive' },
  { name: 'Active Projects', value: '7', icon: BarChart2, change: '+3.7%', changeType: 'positive' },
  { name: 'Team Members', value: '5', icon: Users, change: '0%', changeType: 'neutral' },
  { name: 'Completed Tasks', value: '243', icon: CheckCircle, change: '+5.9%', changeType: 'positive' },
]

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className="rounded-full bg-green-50 p-3">
                  <stat.icon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600"> vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add more dashboard sections here */}
      </div>
    </MainLayout>
  )
}