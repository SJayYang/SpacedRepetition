import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../api/client'
import { DashboardStats } from '../types'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await analyticsAPI.getSummary()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          title="Due Today"
          value={stats?.due_count || 0}
          color="primary"
          icon="📚"
        />
        <StatCard
          title="Reviews Today"
          value={stats?.reviews_today || 0}
          color="green"
          icon="✅"
        />
        <StatCard
          title="Current Streak"
          value={`${stats?.streak || 0} days`}
          color="orange"
          icon="🔥"
        />
        <StatCard
          title="Total Items"
          value={stats?.total_items || 0}
          color="blue"
          icon="📊"
        />
        <StatCard
          title="Retention Rate"
          value={`${stats?.retention_rate || 0}%`}
          color="purple"
          icon="🎯"
        />
        {stats && stats.overdue_count > 0 && (
          <StatCard
            title="Overdue"
            value={stats.overdue_count}
            color="red"
            icon="⚠️"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            to="/review"
            className="flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            Start Review Session
          </Link>
          <Link
            to="/items"
            className="flex items-center justify-center px-6 py-4 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Add New Problem
          </Link>
        </div>
      </div>

      {/* Welcome Message */}
      {stats && stats.total_items === 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Welcome to SpaceRep!
          </h3>
          <p className="text-blue-800 mb-4">
            Get started by importing a preset list or adding your first problem.
          </p>
          <div className="flex gap-4">
            <Link
              to="/collections"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Import Preset List
            </Link>
            <Link
              to="/items"
              className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Add First Problem
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, color, icon }: {
  title: string
  value: string | number
  color: string
  icon: string
}) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className={`border rounded-lg p-6 ${colorClasses[color] || colorClasses.primary}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  )
}
