// Sidebar component
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user } = useAuth()
  return (
    <aside style={{ padding: 12, borderRight: '1px solid var(--card-border)', minWidth: 180, background: 'var(--card-bg)' }}>
      <h4 style={{ color: 'var(--muted)' }}>Navigation</h4>
      <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
        {user?.role === 'Admin' && (
          <>
            <li><Link to="/admin">Users</Link></li>
            <li><Link to="/machines">Machines</Link></li>
            <li><Link to="/alerts">Alerts</Link></li>
            <li><Link to="/logs">Logs</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/engineer">Engineer Dashboard</Link></li>
            <li><Link to="/viewer">Viewer Dashboard</Link></li>
            {user?.role === 'Admin' && (
              <li>
                <a href="/admin/create">Create Machine</a>
              </li>
            )}
          </>
        )}
        {user?.role === 'Engineer' && (
          <>
            <li><Link to="/machines">Machines</Link></li>
            <li><Link to="/alerts">Alerts</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/engineer">Engineer Dashboard</Link></li>
          </>
        )}
        {user?.role === 'Viewer' && (
          <>
            <li><Link to="/machines">Machines</Link></li>
            <li><Link to="/alerts">Alerts</Link></li>
            <li><Link to="/analytics">Analytics</Link></li>
            <li><Link to="/viewer">Viewer Dashboard</Link></li>
          </>
        )}
      </ul>
    </aside>
  )
}