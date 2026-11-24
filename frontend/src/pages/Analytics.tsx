import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/client'
import PageHeader from '../components/common/PageHeader'
import type { RetentionPoint, TopicPerformance } from '../types'

export default function Analytics() {
  const [retention, setRetention] = useState<RetentionPoint[]>([])
  const [topics, setTopics] = useState<TopicPerformance[]>([])
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
    <div>
      <PageHeader title="Analytics" />

      <div className="surface p-5 sm:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Retention over the last 30 days
        </h2>
        {retention.length > 0 ? (
          <div className="space-y-2">
            {retention.slice(-10).map((day) => (
              <div key={day.date} className="flex items-center">
                <div className="w-24 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-primary-500 h-3 rounded-full"
                      style={{ width: `${day.rate}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-600 text-right">
                  {day.rate}%
                  <span className="block text-xs">{day.total_reviews} {day.total_reviews === 1 ? 'review' : 'reviews'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Complete a review to see retention here.</p>
        )}
      </div>

      <div className="surface p-5 sm:p-6">
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
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full bg-primary-500"
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
          <p className="text-gray-500">Add topics to your problems to see performance by topic.</p>
        )}
      </div>
    </div>
  )
}
