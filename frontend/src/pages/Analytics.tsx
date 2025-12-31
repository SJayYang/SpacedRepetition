import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'

export default function Analytics() {
  const [retention, setRetention] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [retentionData, topicsData] = await Promise.all([
        analyticsAPI.getRetention(30),
        analyticsAPI.getTopics(),
      ])
      setRetention(retentionData)
      setTopics(topicsData)
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading analytics...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>

      {/* Retention Rate */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Retention Rate (Last 30 Days)
        </h2>
        {retention.length > 0 ? (
          <div className="space-y-2">
            {retention.slice(-10).map((day) => (
              <div key={day.date} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${day.rate}%` }}
                    >
                      <span className="text-xs text-white font-medium">{day.rate}%</span>
                    </div>
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-600 text-right">
                  {day.total_reviews} reviews
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No review data yet. Complete some reviews to see retention stats!</p>
        )}
      </div>

      {/* Topics Performance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Performance by Topic
        </h2>
        {topics.length > 0 ? (
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.topic} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">{topic.topic}</h3>
                  <span className="text-sm text-gray-600">
                    {topic.total_reviews} reviews
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${
                      topic.success_rate >= 75 ? 'bg-green-500' :
                      topic.success_rate >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${topic.success_rate}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {topic.success_rate}% success rate
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No topic data yet. Add topics to your problems to see performance breakdown!</p>
        )}
      </div>
    </div>
  )
}
