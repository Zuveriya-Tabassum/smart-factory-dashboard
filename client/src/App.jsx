// App component

import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Unauthorized from './pages/Unauthorized'
import AdminPanel from './pages/AdminPanel'
import Alerts from './pages/Alerts'
import Logs from './pages/Logs'
import Analytics from './pages/Analytics'
import AdminCreateMachine from './pages/AdminCreateMachine'

function App() {
  const [count, setCount] = useState(0)
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    // fetchMachines()
    //   .then((data) => setMachines(data))
    //   .catch((err) => setError(err.message || 'Failed to load machines'))
    //   .finally(() => setLoading(false))
  }, [])

  // Remove Vite default content, keep only routes and navbar
  return (
    <>
      <Navbar />
      <Routes>
        {/* Role-aware root redirect */}
        <Route path="/" element={
          // Simple inline role-based redirect
          // Uses localStorage-stored user set by AuthContext
          (() => {
            try {
              const stored = localStorage.getItem('user')
              const parsed = stored ? JSON.parse(stored) : null
              const role = parsed?.role
              if (role === 'Admin') return <Navigate to="/admin" replace />
              if (role === 'Engineer') return <Navigate to="/engineer" replace />
              if (role === 'Viewer') return <Navigate to="/viewer" replace />
            } catch {}
            return <Navigate to="/login" replace />
          })()
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* New Machines alias route for all roles */}
        <Route
          path="/machines"
          element={
            <ProtectedRoute roles={['Admin', 'Engineer', 'Viewer']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* New Analytics route for all roles */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['Admin', 'Engineer', 'Viewer']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        {/* Existing role-specific routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['Admin'] /* change to ['Admin','Engineer'] if desired */}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/engineer"
          element={
            <ProtectedRoute roles={['Engineer', 'Admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewer"
          element={
            <ProtectedRoute roles={['Viewer', 'Engineer', 'Admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute roles={['Admin', 'Engineer', 'Viewer']}>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute roles={['Admin']}>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          path="/admin/create"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminCreateMachine />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
