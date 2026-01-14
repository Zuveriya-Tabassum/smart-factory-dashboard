import { createContext, useContext, useEffect, useState } from 'react'
import { login as apiLogin, register as apiRegister } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  function setSession(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('lastRole', user.role) // persist for theme selection
    setToken(token)
    setUser(user)
  }

  async function login(email, password) {
    const { token, user } = await apiLogin(email, password)
    setSession(token, user)
    return user
  }

  async function signup({ name, email, password, role }) {
    const res = await apiRegister({ name, email, password, role })
    if (res?.token && res?.user) {
      setSession(res.token, res.user) // Admin signup: auto session
    }
    return res
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Intentionally keep lastRole for theme persistence on login/signup
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}