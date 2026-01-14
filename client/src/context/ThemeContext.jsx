// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    // Role-based theme map persisted independently per role
    const mapJson = localStorage.getItem('roleThemeMap')
    const roleThemeMap = mapJson ? JSON.parse(mapJson) : {}
    const userJson = localStorage.getItem('user')
    const lastRole =
      (JSON.parse(userJson || 'null') || null)?.role ||
      localStorage.getItem('lastRole')

    // Default per role if not set
    const defaults = { Admin: 'dark', Engineer: 'sunset', Viewer: 'dark' }

    const roleTheme = lastRole
      ? roleThemeMap[lastRole] || defaults[lastRole] || 'dark'
      : localStorage.getItem('theme') || 'dark'

    return roleTheme
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)

    // Keep role mapping independent
    try {
      const userJson = localStorage.getItem('user')
      const role =
        (JSON.parse(userJson || 'null') || null)?.role ||
        localStorage.getItem('lastRole')
      if (role) {
        const mapJson = localStorage.getItem('roleThemeMap')
        const roleThemeMap = mapJson ? JSON.parse(mapJson) : {}
        roleThemeMap[role] = theme
        localStorage.setItem('roleThemeMap', JSON.stringify(roleThemeMap))
      }
    } catch {}
  }, [theme])

  function setTheme(next) {
    setThemeState(next)
  }

  const value = { theme, setTheme }
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
