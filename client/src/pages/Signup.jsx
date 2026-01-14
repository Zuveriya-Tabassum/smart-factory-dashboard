import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './login.css'

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Viewer')
  const [error, setError] = useState('')

  function roleDestination(role) {
    if (role === 'Admin') return '/admin'
    if (role === 'Engineer') return '/engineer'
    return '/viewer'
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await signup({ name, email, password, role })
      if (res?.token && res?.user) {
        navigate(roleDestination(res.user.role), { replace: true })
      } else {
        navigate('/login', {
          replace: true,
          state: { signupMessage: 'Registration submitted. Awaiting admin approval.' },
        })
      }
    } catch (err) {
      setError(err.message || 'Signup failed')
    }
  }

  return (
    <>
      {/* same animated background as Login */}
      <div className="login-bg">
        <div className="bubbles">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="bubble" />
          ))}
        </div>
      </div>

      {/* centered signup card */}
      <div className="login-page">
        <div className="login-card">
          <h2 className="login-title">Signup</h2>

          {error && (
            <p className="login-message error">Error: {error}</p>
          )}

          <form onSubmit={onSubmit} className="login-form">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              required
              className="login-input"
            />
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              required
              className="login-input"
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              required
              className="login-input"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="login-input"
            >
              <option value="Viewer">Viewer</option>
              <option value="Engineer">Engineer</option>
              <option value="Admin">Admin</option>
            </select>

            <button type="submit" className="login-button">
              Create account
            </button>
          </form>

          <p className="login-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </>
  )
}
