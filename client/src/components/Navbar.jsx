// Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const location = useLocation()

  // hide navbar entirely on login/signup
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const modes = [
    { value: 'light', label: '☀️' },
    { value: 'dark', label: '🌙' },
    { value: 'sunset', label: '✨' }, // custom
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '10px 16px',
        borderBottom: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
      }}
    >
      {/* Theme toggle – 3 modes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {modes.map(m => (
          <button
            key={m.value}
            onClick={() => setTheme(m.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              border:
                theme === m.value
                  ? '2px solid var(--accent)'
                  : '1px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Role-aware navigation */}
      {user && (
        <div style={{ display: 'flex', gap: 12, marginLeft: 24 }}>
          {/* Admin links: Admin -> Home, remove Engineer/Viewer, add Add Machine */}
          {user.role === 'Admin' && (
            <>
              <Link to="/admin">Home</Link>
              <Link to="/admin/create">Add Machine</Link>
              <Link to="/machines">Machines</Link>
              <Link to="/alerts">Alerts</Link>
              <Link to="/logs">Logs</Link>
              <Link to="/analytics">Analytics</Link>
            </>
          )}

          {/* Engineer links: no Engineer/Viewer tabs */}
          {user.role === 'Engineer' && (
            <>
              <Link to="/machines">Machines</Link>
              <Link to="/alerts">Alerts</Link>
              <Link to="/analytics">Analytics</Link>
            </>
          )}

          {/* Viewer links: no Viewer/Engineer tabs */}
          {user.role === 'Viewer' && (
            <>
              <Link to="/machines">Machines</Link>
              <Link to="/alerts">Alerts</Link>
              <Link to="/analytics">Analytics</Link>
            </>
          )}
        </div>
      )}

      {/* Right side: user info / auth links */}
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
        {user ? (
          <>
            <span>
              Signed in as <strong>{user.name}</strong> ({user.role})
            </span>
            <button onClick={handleLogout} className="btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </span>
    </nav>
  )
}
