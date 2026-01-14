import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const signupMessage = location.state?.signupMessage || ''

  function roleDestination(role) {
    if (role === 'Admin') return '/admin'
    if (role === 'Engineer') return '/engineer'
    return '/viewer'
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const user = await login(email, password)
      navigate(roleDestination(user.role), { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return (
    <>
      {/* fixed animated background */}
      <div className="login-bg">
        <div className="bubbles">
          {Array.from({ length: 15 }).map((_, i) => (
            <span key={i} className="bubble" />
          ))}
        </div>
      </div>

      {/* centered card, scrollable if needed */}
      <div className="login-page">
        <div className="login-card">
          <h2 className="login-title">Login</h2>

          {signupMessage && (
            <p className="login-message success">{signupMessage}</p>
          )}
          {error && (
            <p className="login-message error">Error: {error}</p>
          )}

          <form onSubmit={onSubmit} className="login-form">
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
            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          <p className="login-footer">
            Don’t have an account? <Link to="/signup">Signup</Link>
          </p>
        </div>
      </div>
    </>
  )
}
