import { ArrowDownToLine, ArrowRight, Bell, CalendarDays, Check, ChevronRight, Layers2, Plus, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../api/client'
import type { DashboardStats } from '../types'

const number = new Intl.NumberFormat()
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'full' })
type ActivityDay = { date: string; count: number }

function dateKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-')
}

function studyWeek(activity: ActivityDay[]) {
  const today = new Date()
  const todayKey = dateKey(today)
  const monday = new Date(today)
  monday.setDate(today.getDate() - (today.getDay() + 6) % 7)
  const counts = new Map(activity.map(day => [day.date, day.count]))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    const key = dateKey(date)
    return {
      key,
      weekday: weekday.format(date),
      count: counts.get(key) ?? 0,
      isToday: key === todayKey,
    }
  })
}

function ReviewActivity({ activity }: { activity: ActivityDay[] | null | undefined }) {
  const week = studyWeek(activity ?? [])
  const total = week.reduce((sum, day) => sum + day.count, 0)
  const max = Math.max(1, ...week.map(day => day.count))

  return (
    <section className="dashboard-activity surface" aria-labelledby="activity-heading">
      <div className="dashboard-activity-heading">
        <div>
          <h2 id="activity-heading">Review activity</h2>
          <p>This week</p>
        </div>
        <Link to="/analytics" className="icon-link" aria-label="View analytics">
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <p className="activity-total"><strong>{activity ? number.format(total) : '—'}</strong> reviews</p>
      {activity ? (
        <ul className="activity-chart" aria-label="Reviews by day">
          {week.map(day => (
            <li key={day.key} className={day.isToday ? 'today' : undefined}>
              <span className="activity-bar" title={`${day.weekday} · ${day.count} reviews`}>
                <span style={{ height: `${day.count / max * 100}%` }} />
              </span>
              <span aria-hidden="true">{day.weekday}</span>
              <span className="sr-only">{day.weekday}: {day.count} reviews</span>
            </li>
          ))}
        </ul>
      ) : <p className="muted-text">{activity === null ? 'Review activity is unavailable.' : 'Loading activity…'}</p>}
    </section>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityDay[] | null>()
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    analyticsAPI.getSummary()
      .then(result => { if (active) setStats(result) })
      .catch(() => { if (active) setError(true) })
    analyticsAPI.getHeatmap(7, Intl.DateTimeFormat().resolvedOptions().timeZone)
      .then(result => { if (active) setActivity(result) })
      .catch(() => { if (active) setActivity(null) })
    return () => { active = false }
  }, [])

  const due = stats?.due_count ?? 0
  const hasItems = Boolean(stats?.total_items)

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-date"><CalendarDays size={15} aria-hidden="true" /> {fullDate.format(new Date())}</p>
          <h1>Dashboard</h1>
        </div>
        <Link to="/items?add=1" className="ui-button ui-button-primary"><Plus size={17} aria-hidden="true" /> New problem</Link>
      </div>

      {error && <p className="dashboard-error" role="alert">Study statistics couldn’t be loaded. Refresh the page to try again.</p>}

      <div className="dashboard-feature-row">
        <section className="review-panel" aria-labelledby="queue-heading">
          <div className="review-orbit" aria-hidden="true"><span /><span /><span /><i /></div>
          <span className="review-panel-icon"><RotateCcw size={19} aria-hidden="true" /></span>
          <div className="review-panel-content">
            <h2 id="queue-heading">Review queue</h2>
            <p className="review-count">
              <strong>{stats ? number.format(due) : '—'}</strong>
              <span>{due === 1 ? 'problem due' : 'problems due'}</span>
            </p>
            {Boolean(stats?.overdue_count) && (
              <p className="review-overdue"><Bell size={14} aria-hidden="true" /> {stats?.overdue_count} overdue</p>
            )}
            <Link to="/review" className="ui-button review-button">Start review <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
        <ReviewActivity activity={activity} />
      </div>

      <section className="dashboard-section" aria-labelledby="metrics-heading">
        <h2 id="metrics-heading">Study overview</h2>
        <dl className="dashboard-metrics surface">
          <div><dt>Reviewed today</dt><dd>{stats ? number.format(stats.reviews_today) : '—'}</dd></div>
          <div><dt>Current streak</dt><dd>{stats ? number.format(stats.streak) : '—'} <span>{stats?.streak === 1 ? 'day' : 'days'}</span></dd></div>
          <div><dt>Retention rate</dt><dd>{stats ? `${number.format(stats.retention_rate)}%` : '—'}</dd></div>
          <div><dt>Problems saved</dt><dd>{stats ? number.format(stats.total_items) : '—'}</dd></div>
        </dl>
      </section>

      <section className="dashboard-section" aria-labelledby="library-heading">
        <h2 id="library-heading">Your library</h2>
        <div className="dashboard-library surface">
          <div className="library-summary">
            <span className="library-icon">{hasItems ? <Check size={19} aria-hidden="true" /> : <Layers2 size={19} aria-hidden="true" />}</span>
            <div>
              <h3>{stats && !hasItems ? 'Add your first problem' : 'Problem library'}</h3>
              <p>{stats && !hasItems ? 'Add a problem manually or import a curated list.' : 'Browse and manage your saved problems.'}</p>
            </div>
          </div>
          <Link to={stats && !hasItems ? '/collections?import=1' : '/items'} className="ui-button ui-button-secondary">
            {stats && !hasItems ? <><ArrowDownToLine size={16} aria-hidden="true" /> Browse presets</> : <>View problems <ChevronRight size={16} aria-hidden="true" /></>}
          </Link>
        </div>
      </section>
    </div>
  )
}
