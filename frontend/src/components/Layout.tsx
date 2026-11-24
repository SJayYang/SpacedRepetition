import { ChartNoAxesColumn, ChevronsUpDown, FolderClosed, LayoutDashboard, LibraryBig, LogOut, RotateCcw, Settings } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import WorkspaceBrand from './WorkspaceBrand'

const studyLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/review', label: 'Review', icon: RotateCcw },
  { path: '/collections', label: 'Collections', icon: FolderClosed },
  { path: '/items', label: 'Problems', icon: LibraryBig },
  { path: '/analytics', label: 'Analytics', icon: ChartNoAxesColumn },
]
const settingsLink = { path: '/settings', label: 'Settings', icon: Settings }
const allLinks = [...studyLinks, settingsLink]

function NavigationLink({ path, label, icon: Icon }: typeof settingsLink) {
  return (
    <NavLink to={path} className="workspace-nav-link">
      <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout({ email }: { email?: string }) {
  const location = useLocation()
  const section = allLinks.find(({ path }) => location.pathname.startsWith(path))
  const account = email?.split('@')[0] || 'Account'

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/login'
  }

  return (
    <div className="workspace">
      <a className="workspace-skip" href="#workspace-content">Skip to content</a>
      <aside className="workspace-sidebar">
        <Link to="/dashboard" className="workspace-logo"><WorkspaceBrand /></Link>
        <nav className="workspace-nav" aria-label="Main navigation">
          {studyLinks.map(entry => <NavigationLink key={entry.path} {...entry} />)}
          <div className="workspace-nav-separator" />
          <NavigationLink {...settingsLink} />
        </nav>
        <details className="workspace-account">
          <summary>
            <span className="workspace-avatar" aria-hidden="true">{account[0].toUpperCase()}</span>
            <span className="workspace-account-label">
              <strong>Account</strong>
              {email && <span title={email}>{email}</span>}
            </span>
            <ChevronsUpDown size={15} aria-hidden="true" />
          </summary>
          <button type="button" onClick={handleSignOut}><LogOut size={16} aria-hidden="true" /> Sign out</button>
        </details>
      </aside>

      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="workspace-topbar-inner">
            <Link to="/dashboard" className="workspace-mobile-brand"><WorkspaceBrand /></Link>
            <div className="workspace-breadcrumb">
              <span>Workspace</span><span aria-hidden="true">/</span><strong>{section?.label}</strong>
            </div>
            <button className="workspace-mobile-signout" type="button" onClick={handleSignOut} aria-label="Sign out">
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
          <nav className="workspace-mobile-nav" aria-label="Main navigation">
            {allLinks.map(entry => <NavigationLink key={entry.path} {...entry} />)}
          </nav>
        </header>
        <main id="workspace-content" className="workspace-content" tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  )
}
