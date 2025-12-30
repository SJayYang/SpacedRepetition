import { useEffect, useState } from 'react'
import { authAPI } from '../api/client'

export default function Settings() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    daily_review_limit: 100,
    new_items_per_day: 20,
    default_ease_factor: 2.5,
    timezone: 'UTC',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await authAPI.getMe()
      setProfile(data)
      setSettings({
        daily_review_limit: data.daily_review_limit || 100,
        new_items_per_day: data.new_items_per_day || 20,
        default_ease_factor: data.default_ease_factor || 2.5,
        timezone: data.timezone || 'UTC',
      })
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await authAPI.updateSettings(settings)
      alert('Settings saved successfully!')
    } catch (err) {
      console.error('Error saving settings:', err)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Profile Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-900">{profile?.email}</span>
          </div>
          {profile?.display_name && (
            <div>
              <span className="text-sm font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-900">{profile.display_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Review Limit
            </label>
            <input
              type="number"
              value={settings.daily_review_limit}
              onChange={(e) => setSettings({ ...settings, daily_review_limit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              min="1"
              max="500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of reviews per day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Items Per Day
            </label>
            <input
              type="number"
              value={settings.new_items_per_day}
              onChange={(e) => setSettings({ ...settings, new_items_per_day: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of new items to introduce per day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Ease Factor
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.default_ease_factor}
              onChange={(e) => setSettings({ ...settings, default_ease_factor: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              min="1.3"
              max="5.0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Starting ease factor for new items (affects spacing intervals)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
