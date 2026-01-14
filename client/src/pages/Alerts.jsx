// src/pages/Alerts.jsx
import { useEffect, useState } from 'react'
import {
  listAlertsCorrect as listAlerts,
  resolveAlert,
  acknowledgeAlert,
} from '../services/api'
import { useAuth } from '../context/AuthContext'
// If you later add real-time updates via socket.io:
// import { socket } from '../socket/socket'

export default function Alerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')
  const [notes, setNotes] = useState({})

  async function refresh() {
    try {
      const data = await listAlerts()
      setAlerts(data)
    } catch (err) {
      setError(err.message || 'Failed to load alerts')
    }
  }

  useEffect(() => {
    refresh()

    // To enable real-time updates later, uncomment:
    // socket.on('alert_update', refresh)
    // return () => socket.off('alert_update', refresh)
  }, [])

  async function onResolve(id) {
    try {
      await resolveAlert(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to resolve alert')
    }
  }

  async function onAcknowledge(id) {
    try {
      const note = notes[id] || ''
      await acknowledgeAlert(id, note)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to acknowledge alert')
    }
  }

  function badgeStyle(sev) {
    const s = (sev || '').toLowerCase()
    const colors = {
      high: '#dc3545',   // red
      medium: '#fd7e14', // orange
      low: '#ffc107',    // yellow
    }
    return {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      backgroundColor: colors[s] || '#6c757d',
      color: '#fff',
      fontSize: 11,
      textTransform: 'capitalize',
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)', // account for fixed navbar
        display: 'flex',
        justifyContent: 'center',
        padding: '16px 16px 32px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          background: 'var(--card-bg)',
          borderRadius: 16,
          border: '1px solid var(--card-border)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          padding: '20px 24px 28px',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Alerts</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              Live safety and performance alerts from all machines.
            </p>
          </div>
        </header>

        {error && (
          <p className="toast toast-error" style={{ marginBottom: 12 }}>
            Error: {error}
          </p>
        )}

        {alerts.length === 0 ? (
          <p>No alerts found.</p>
        ) : (
          <div
            style={{
              borderRadius: 12,
              border: '1px solid rgba(59,130,246,0.35)',
              overflow: 'hidden',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead
                style={{
                  background:
                    'linear-gradient(90deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9))',
                  color: '#e5e7eb',
                }}
              >
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                    Machine
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                    Type
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                    Severity
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                    Message
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                    Ack
                  </th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                    Resolved
                  </th>
                  <th style={{ padding: '8px 10px' }} />
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr
                    key={a.id}
                    style={{
                      transition:
                        'background-color 120ms ease, transform 100ms ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        'rgba(15,23,42,0.35)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <td style={{ padding: '8px 10px', fontSize: 14 }}>
                      {a.machineId}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 14 }}>
                      {a.type}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={badgeStyle(a.severity)}>
                        {a.severity}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 14 }}>
                      {a.message}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 14 }}>
                      {a.acknowledged ? 'Yes' : 'No'}
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 14 }}>
                      {a.resolved ? 'Yes' : 'No'}
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      {(user?.role === 'Engineer' ||
                        user?.role === 'Admin') &&
                        !a.acknowledged &&
                        !a.resolved && (
                          <>
                            <input
                              placeholder="Note"
                              value={notes[a.id] || ''}
                              onChange={e =>
                                setNotes(prev => ({
                                  ...prev,
                                  [a.id]: e.target.value,
                                }))
                              }
                              style={{
                                padding: '4px 6px',
                                borderRadius: 999,
                                border: '1px solid var(--card-border)',
                                fontSize: 12,
                              }}
                            />
                            <button
                              onClick={() => onAcknowledge(a.id)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: 'none',
                                background:
                                  'linear-gradient(90deg,#22c55e,#4ade80)',
                                color: '#fff',
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              Ack
                            </button>
                          </>
                        )}

                      {user?.role === 'Admin' && !a.resolved && (
                        <button
                          onClick={() => onResolve(a.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: 'none',
                            background:
                              'linear-gradient(90deg,#2563eb,#1d4ed8)',
                            color: '#fff',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
