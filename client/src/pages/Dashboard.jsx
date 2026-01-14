// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  fetchMachines,
  startMachine,
  stopMachine,
  resetMachine,
  assignJob,
  setMode,
  startMaintenance,
  clearMaintenance,
} from '../services/api'
import { socket } from '../socket/socket'

export default function Dashboard() {
  const { user } = useAuth()
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobInputs, setJobInputs] = useState({})
  const [modeInputs, setModeInputs] = useState({})
  const [statusFilter, setStatusFilter] = useState('All') // All | Active | Maintenance | Critical
  const [search, setSearch] = useState('') // text filter for name/type

  useEffect(() => {
    setLoading(true)
    fetchMachines()
      .then(setMachines)
      .catch(err => setError(err.message || 'Failed to load machines'))
      .finally(() => setLoading(false))

    socket.on('machine_update', updated => {
      setMachines(updated)
    })
    return () => {
      socket.off('machine_update')
    }
  }, [])

  const canControl = user?.role === 'Admin' || user?.role === 'Engineer'

  async function onAction(id, type) {
    try {
      setError('')
      if (type === 'start') await startMachine(id)
      else if (type === 'stop') await stopMachine(id)
      else if (type === 'reset') await resetMachine(id)
    } catch (err) {
      setError(err.message || `Failed to ${type} machine`)
    }
  }

  async function onAssign(id, job) {
    try {
      if (!job) return
      setError('')
      await assignJob(id, job)
      setJobInputs(prev => ({ ...prev, [id]: '' }))
    } catch (err) {
      setError(err.message || 'Failed to assign job')
    }
  }

  async function onMode(id, mode) {
    try {
      setError('')
      await setMode(id, mode)
    } catch (err) {
      setError(err.message || 'Failed to set mode')
    }
  }

  async function onStartMaintenance(id) {
    try {
      const reason = window.prompt('Enter maintenance reason')
      await startMaintenance(id, { reason: reason || 'Scheduled' })
    } catch (err) {
      setError(err.message || 'Failed to start maintenance')
    }
  }

  async function onClearMaintenance(id) {
    try {
      await clearMaintenance(id)
    } catch (err) {
      setError(err.message || 'Failed to clear maintenance')
    }
  }

  function healthStatus(m) {
    const maxTemp = m.maxTemperature ?? 80
    const minEff = m.minEfficiency ?? 60
    const temp = typeof m.temperature === 'number' ? m.temperature : 0
    const eff = typeof m.efficiency === 'number' ? m.efficiency : 0
    const status = (m.status || '').toLowerCase()

    if (status === 'error' || temp > maxTemp || eff < minEff * 0.8)
      return 'Critical'
    if (temp > maxTemp * 0.9 || eff < minEff) return 'Warning'
    return 'Healthy'
  }

  function healthStyle(level) {
    const l = (level || '').toLowerCase()
    const map = {
      healthy: 'badge badge-healthy',
      warning: 'badge badge-warning',
      critical: 'badge badge-critical',
    }
    return map[l] || 'badge'
  }

  function statusStyleClass(status) {
    const s = (status || '').toLowerCase()
    const map = {
      active: 'badge badge-active',
      idle: 'badge badge-idle',
      error: 'badge badge-error',
    }
    return map[s] || 'badge'
  }

  const totalMachines = machines.length
  const activeCount = machines.filter(
    m => (m.status || '').toLowerCase() === 'active'
  ).length
  const maintCount = machines.filter(m => m.underMaintenance).length
  const avgEfficiency = totalMachines
    ? machines.reduce(
        (s, m) => s + (typeof m.efficiency === 'number' ? m.efficiency : 0),
        0
      ) / totalMachines
    : 0

  // apply status + text filters
  const filteredMachines = machines.filter(m => {
    // status filter
    if (statusFilter === 'Active') {
      if ((m.status || '').toLowerCase() !== 'active') return false
    } else if (statusFilter === 'Maintenance') {
      if (!m.underMaintenance) return false
    } else if (statusFilter === 'Critical') {
      if (healthStatus(m) !== 'Critical') return false
    }

    // text filter (name or type)
    const q = search.trim().toLowerCase()
    if (!q) return true
    const name = (m.name || '').toLowerCase()
    const type = (m.type || '').toLowerCase()
    return name.includes(q) || type.includes(q)
  })

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '16px 16px 32px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1200,
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
            <h2 style={{ margin: 0 }}>{user?.role} Dashboard</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              Welcome, <strong>{user?.name}</strong>.
            </p>
          </div>
        </header>

        {error && (
          <p className="toast toast-error" style={{ marginBottom: 12 }}>
            Error: {error}
          </p>
        )}

        {/* KPI row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 12,
            marginTop: 4,
            marginBottom: 16,
          }}
        >
          {[
            { label: 'Machines', value: totalMachines },
            { label: 'Active', value: activeCount },
            { label: 'Under Maintenance', value: maintCount },
            {
              label: 'Avg Efficiency',
              value: `${avgEfficiency.toFixed(1)}%`,
            },
          ].map((k, idx) => (
            <div
              key={idx}
              className="card kpi"
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(59,130,246,0.35)',
                transition:
                  'transform 120ms ease, box-shadow 160ms ease, border-color 120ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow =
                  '0 10px 25px rgba(37, 99, 235, 0.35)'
                e.currentTarget.style.borderColor = '#3b82f6'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor =
                  'rgba(59,130,246,0.35)'
              }}
            >
              <div className="muted">{k.label}</div>
              <div className="kpi-value">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Machines + filters */}
        <section>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Machines</h3>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {/* search by name/type */}
              <input
                type="text"
                placeholder="Filter by name or type"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--card-border)',
                  minWidth: 180,
                }}
              />

              {/* status filter pills */}
              {['All', 'Active', 'Maintenance', 'Critical'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    border:
                      statusFilter === f
                        ? '2px solid #3b82f6'
                        : '1px solid var(--card-border)',
                    background:
                      statusFilter === f
                        ? 'rgba(59,130,246,0.15)'
                        : 'transparent',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading && <p>Loading machines...</p>}
          {!loading && filteredMachines.length === 0 && (
            <p>No machines found.</p>
          )}

          <div
            className="grid-cards"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              marginTop: 8,
            }}
          >
            {filteredMachines.map(m => {
              const hs = healthStatus(m)
              return (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--card-border)',
                    padding: '12px 14px',
                    transition:
                      'transform 120ms ease, box-shadow 160ms ease, border-color 120ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 12px 28px rgba(15,23,42,0.45)'
                    e.currentTarget.style.borderColor = '#3b82f6'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'var(--card-border)'
                  }}
                >
                  <h4 style={{ marginBottom: 4 }}>
                    {m.name} — {m.type}
                  </h4>
                  <p>
                    Status:{' '}
                    <span className={statusStyleClass(m.status)}>
                      {m.status || 'Unknown'}
                    </span>
                  </p>
                  <p>
                    Health:{' '}
                    <span className={healthStyle(hs)}>{hs}</span>
                  </p>
                  <p>
                    Temp: {m.temperature?.toFixed?.(1)}°C | Eff:{' '}
                    {m.efficiency?.toFixed?.(1)}% | Cycle: {m.cycleTime}
                  </p>
                  <p>
                    Mode: <strong>{m.mode || 'Auto'}</strong>
                  </p>
                  <p>Job: {m.currentJob || '—'}</p>
                  <p>
                    Last Maintenance:{' '}
                    {m.lastMaintenanceDate
                      ? new Date(
                          m.lastMaintenanceDate
                        ).toLocaleString()
                      : '—'}
                  </p>

                  {canControl && (
                    <>
                      <div
                        className="row-actions"
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          marginTop: 8,
                        }}
                      >
                        <button
                          className="btn"
                          disabled={m.underMaintenance}
                          onClick={() => onAction(m.id, 'start')}
                        >
                          Start
                        </button>
                        <button
                          className="btn secondary"
                          disabled={m.underMaintenance}
                          onClick={() => onAction(m.id, 'stop')}
                        >
                          Stop
                        </button>
                        <button
                          className="btn"
                          disabled={m.underMaintenance}
                          onClick={() => onAction(m.id, 'reset')}
                        >
                          Reset
                        </button>
                      </div>

                      <div className="col-actions" style={{ marginTop: 8 }}>
                        <div
                          className="row-actions"
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <input
                            placeholder="Assign job/task"
                            value={jobInputs[m.id] || ''}
                            onChange={e =>
                              setJobInputs(prev => ({
                                ...prev,
                                [m.id]: e.target.value,
                              }))
                            }
                            className="input"
                            style={{ flex: 1 }}
                          />
                          <button
                            className="btn"
                            disabled={m.underMaintenance}
                            onClick={() =>
                              onAssign(m.id, jobInputs[m.id] || '')
                            }
                          >
                            Assign
                          </button>
                        </div>

                        <div
                          className="row-actions"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span className="muted">Mode:</span>
                          <select
                            value={
                              modeInputs[m.id] || m.mode || 'Auto'
                            }
                            onChange={e =>
                              setModeInputs(prev => ({
                                ...prev,
                                [m.id]: e.target.value,
                              }))
                            }
                            className="select"
                          >
                            <option value="Auto">Auto</option>
                            <option value="Manual">Manual</option>
                          </select>
                          <button
                            className="btn"
                            disabled={m.underMaintenance}
                            onClick={() =>
                              onMode(m.id, modeInputs[m.id] || 'Auto')
                            }
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      {(user?.role === 'Engineer' ||
                        user?.role === 'Admin') && (
                        <div
                          className="row-actions"
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          {!m.underMaintenance ? (
                            <button
                              className="btn"
                              onClick={() =>
                                onStartMaintenance(m.id)
                              }
                            >
                              Start Maintenance
                            </button>
                          ) : (
                            <button
                              className="btn secondary"
                              onClick={() =>
                                onClearMaintenance(m.id)
                              }
                            >
                              Clear Maintenance
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
