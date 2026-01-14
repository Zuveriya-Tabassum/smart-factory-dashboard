// src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react'
import {
  getPendingUsers,
  approveUser,
  getRoleCounts,
  getUsersByRole,
  emergencyShutdown,
  seedMachines,
  rejectUser,
  updateUserRole,
  suspendUser,
  reactivateUser,
  createMachine,
  deleteMachine,
  assignEngineer,
  updateMachine,
} from '../services/api'
import { fetchMachines, updateThresholds } from '../services/api'

export default function AdminPanel() {
  const [pending, setPending] = useState([])
  const [counts, setCounts] = useState({
    viewerCount: 0,
    engineerCount: 0,
    adminCount: 0,
  })
  const [error, setError] = useState('')
  const [viewerUsers, setViewerUsers] = useState([])
  const [engineerUsers, setEngineerUsers] = useState([])
  const [roleDrafts, setRoleDrafts] = useState({})
  const [machines, setMachines] = useState([])
  const [thresholdDrafts, setThresholdDrafts] = useState({})
  const [newMachine, setNewMachine] = useState({ name: '', type: 'Conveyor' })
  const [assignmentDrafts, setAssignmentDrafts] = useState({}) // machineId -> engineerId

  const [editDrafts, setEditDrafts] = useState({})
  const [editingId, setEditingId] = useState(null)

  async function refresh() {
    try {
      const [p, c, viewers, engineers, ms] = await Promise.all([
        getPendingUsers(),
        getRoleCounts(),
        getUsersByRole('Viewer'),
        getUsersByRole('Engineer'),
        fetchMachines(),
      ])
      setPending(p)
      setCounts(c)
      setViewerUsers(viewers)
      setEngineerUsers(engineers)
      setMachines(ms)

      const drafts = {}
      ms.forEach(m => {
        drafts[m.id] = {
          maxTemperature: m.maxTemperature ?? 80,
          minEfficiency: m.minEfficiency ?? 60,
        }
      })
      setThresholdDrafts(drafts)

      const assignDrafts = {}
      ms.forEach(m => {
        assignDrafts[m.id] = m.assignedEngineerId ?? ''
      })
      setAssignmentDrafts(assignDrafts)

      const ed = {}
      ms.forEach(m => {
        ed[m.id] = { name: m.name, type: m.type }
      })
      setEditDrafts(ed)

      setEditingId(null)
    } catch (err) {
      setError(err.message || 'Failed to load admin data')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function onApprove(id) {
    try {
      await approveUser(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to approve user')
    }
  }

  async function onEmergencyShutdown() {
    try {
      const reason = window.prompt('Enter emergency shutdown reason:')
      if (!reason) return
      await emergencyShutdown(reason)
      alert('Emergency shutdown executed.')
    } catch (err) {
      setError(err.message || 'Emergency shutdown failed')
    }
  }

  async function onSeed() {
    try {
      await seedMachines()
      await refresh()
      alert('Machines seeded.')
    } catch (err) {
      setError(err.message || 'Seeding failed')
    }
  }

  async function onReject(id) {
    try {
      await rejectUser(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to reject user')
    }
  }

  async function onChangeRole(id) {
    try {
      const role = roleDrafts[id]
      if (!role) return
      await updateUserRole(id, role)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to update role')
    }
  }

  async function onSuspend(id) {
    try {
      await suspendUser(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to suspend user')
    }
  }

  async function onReactivate(id) {
    try {
      await reactivateUser(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to reactivate user')
    }
  }

  async function onUpdateThresholds(id) {
    try {
      const draft = thresholdDrafts[id]
      if (!draft) return
      await updateThresholds(id, {
        maxTemperature: Number(draft.maxTemperature),
        minEfficiency: Number(draft.minEfficiency),
      })
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to update thresholds')
    }
  }

  async function onCreateMachine() {
    try {
      const { name, type } = newMachine
      if (!name || !type) return
      await createMachine({ name, type })
      setNewMachine({ name: '', type: 'Conveyor' })
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to create machine')
    }
  }

  async function onDeleteMachine(id) {
    try {
      await deleteMachine(id)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to delete machine')
    }
  }

  async function onAssignEngineer(id) {
    try {
      const engineerId = assignmentDrafts[id]
      if (!engineerId) return
      await assignEngineer(id, engineerId)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to assign engineer')
    }
  }

  function onEditStart(id) {
    setEditingId(id)
  }

  function onEditCancel() {
    setEditingId(null)
  }

  async function onEditSave(id) {
    try {
      const draft = editDrafts[id]
      if (!draft || !draft.name || !draft.type) return
      await updateMachine(id, { name: draft.name, type: draft.type })
      setEditingId(null)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to update machine')
    }
  }

  // helper for hover effect
  function attachHoverStyles(baseStyle) {
    return {
      ...baseStyle,
      onMouseEnter: e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.35)'
        e.currentTarget.style.borderColor = '#3b82f6'
      },
      onMouseLeave: e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = '#1d4ed8'
      },
    }
  }

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
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              Manage users, machines, and safety operations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEmergencyShutdown}>Emergency Shutdown</button>
            <button onClick={onSeed}>Seed Demo Machines</button>
          </div>
        </header>

        {error && (
          <p className="toast toast-error" style={{ marginBottom: 16 }}>
            Error: {error}
          </p>
        )}

        {/* Top grid: user counts + pending approvals */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* User counts as three boxes */}
          <section
            className="card"
            style={{ border: '1px solid #1d4ed8', borderRadius: 12 }}
          >
            <h3>User Counts</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
                marginTop: 8,
              }}
            >
              {/* Admin box */}
              <div
                style={{
                  border: '1px solid #1d4ed8',
                  borderRadius: 10,
                  padding: '10px 12px',
                  transition:
                    'transform 120ms ease, box-shadow 160ms ease, border-color 120ms ease',
                  cursor: 'default',
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
                  e.currentTarget.style.borderColor = '#1d4ed8'
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>Admins</div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>
                  {counts.adminCount}
                </div>
              </div>

              {/* Engineer box */}
              <div
                style={{
                  border: '1px solid #1d4ed8',
                  borderRadius: 10,
                  padding: '10px 12px',
                  transition:
                    'transform 120ms ease, box-shadow 160ms ease, border-color 120ms ease',
                  cursor: 'default',
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
                  e.currentTarget.style.borderColor = '#1d4ed8'
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Engineers
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>
                  {counts.engineerCount}
                </div>
              </div>

              {/* Viewer box */}
              <div
                style={{
                  border: '1px solid #1d4ed8',
                  borderRadius: 10,
                  padding: '10px 12px',
                  transition:
                    'transform 120ms ease, box-shadow 160ms ease, border-color 120ms ease',
                  cursor: 'default',
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
                  e.currentTarget.style.borderColor = '#1d4ed8'
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Viewers
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>
                  {counts.viewerCount}
                </div>
              </div>
            </div>
          </section>

          {/* Pending approvals */}
          <section className="card">
            <h3>Pending Approvals</h3>
            {pending.length === 0 ? (
              <p>No pending requests.</p>
            ) : (
              <div style={{ maxHeight: 220, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Name</th>
                      <th style={{ textAlign: 'left' }}>Email</th>
                      <th style={{ textAlign: 'left' }}>Role</th>
                      <th style={{ textAlign: 'left' }}>Requested At</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                        <td>{new Date(u.createdAt).toLocaleString()}</td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => onApprove(u.id)}>Approve</button>
                          <button onClick={() => onReject(u.id)}>Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Approved users */}
        <section className="card" style={{ marginBottom: 16 }}>
          <h3>Approved Users</h3>
          {viewerUsers.length + engineerUsers.length === 0 ? (
            <p>No approved users found.</p>
          ) : (
            <div style={{ maxHeight: 260, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Name</th>
                    <th style={{ textAlign: 'left' }}>Email</th>
                    <th style={{ textAlign: 'left' }}>Role</th>
                    <th style={{ textAlign: 'left' }}>Joined</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'left' }}>Change Role</th>
                    <th style={{ textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...viewerUsers, ...engineerUsers].map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.active ? 'success' : 'warning'
                          }`}
                        >
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={roleDrafts[u.id] ?? u.role}
                          onChange={e =>
                            setRoleDrafts(prev => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Engineer">Engineer</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <button
                          onClick={() => onChangeRole(u.id)}
                          style={{ marginLeft: 8 }}
                        >
                          Update
                        </button>
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        {u.active ? (
                          <button onClick={() => onSuspend(u.id)}>
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => onReactivate(u.id)}>
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Machines + thresholds grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.1fr)',
            gap: 16,
          }}
        >
          {/* Manage machines */}
          <section className="card">
            <h3>Manage Machines</h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <input
                placeholder="Machine name"
                value={newMachine.name}
                onChange={e =>
                  setNewMachine(prev => ({ ...prev, name: e.target.value }))
                }
              />
              <select
                value={newMachine.type}
                onChange={e =>
                  setNewMachine(prev => ({ ...prev, type: e.target.value }))
                }
              >
                <option value="Conveyor">Conveyor</option>
                <option value="Robot">Robot</option>
                <option value="Press">Press</option>
              </select>
              <button onClick={onCreateMachine}>Create</button>
            </div>

            {machines.length === 0 ? (
              <p>No machines found.</p>
            ) : (
              <div style={{ maxHeight: 260, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Machine</th>
                      <th style={{ textAlign: 'left' }}>Type</th>
                      <th style={{ textAlign: 'left' }}>Assign Engineer</th>
                      <th style={{ textAlign: 'left' }}>Edit</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map(m => (
                      <tr key={m.id}>
                        <td>
                          {editingId === m.id ? (
                            <input
                              value={editDrafts[m.id]?.name ?? ''}
                              onChange={e =>
                                setEditDrafts(prev => ({
                                  ...prev,
                                  [m.id]: {
                                    ...prev[m.id],
                                    name: e.target.value,
                                  },
                                }))
                              }
                            />
                          ) : (
                            m.name
                          )}
                        </td>
                        <td>
                          {editingId === m.id ? (
                            <select
                              value={editDrafts[m.id]?.type ?? 'Conveyor'}
                              onChange={e =>
                                setEditDrafts(prev => ({
                                  ...prev,
                                  [m.id]: {
                                    ...prev[m.id],
                                    type: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="Conveyor">Conveyor</option>
                              <option value="Robot">Robot</option>
                              <option value="Press">Press</option>
                            </select>
                          ) : (
                            m.type
                          )}
                        </td>
                        <td>
                          <select
                            value={assignmentDrafts[m.id] ?? ''}
                            onChange={e =>
                              setAssignmentDrafts(prev => ({
                                ...prev,
                                [m.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Unassigned</option>
                            {engineerUsers.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => onAssignEngineer(m.id)}
                            style={{ marginLeft: 8 }}
                          >
                            Apply
                          </button>
                        </td>
                        <td>
                          {editingId === m.id ? (
                            <>
                              <button
                                onClick={() => onEditSave(m.id)}
                                style={{ marginRight: 8 }}
                              >
                                Save
                              </button>
                              <button onClick={onEditCancel}>Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => onEditStart(m.id)}>
                              Edit
                            </button>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => onDeleteMachine(m.id)}
                            style={{ color: 'red' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Thresholds */}
          <section className="card">
            <h3>Alert Thresholds</h3>
            {machines.length === 0 ? (
              <p>No machines found.</p>
            ) : (
              <div style={{ maxHeight: 260, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Machine</th>
                      <th style={{ textAlign: 'left' }}>Type</th>
                      <th style={{ textAlign: 'left' }}>Max Temp (°C)</th>
                      <th style={{ textAlign: 'left' }}>Min Efficiency (%)</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map(m => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.type}</td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            value={
                              thresholdDrafts[m.id]?.maxTemperature ?? 80
                            }
                            onChange={e =>
                              setThresholdDrafts(prev => ({
                                ...prev,
                                [m.id]: {
                                  ...prev[m.id],
                                  maxTemperature: e.target.value,
                                },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            value={
                              thresholdDrafts[m.id]?.minEfficiency ?? 60
                            }
                            onChange={e =>
                              setThresholdDrafts(prev => ({
                                ...prev,
                                [m.id]: {
                                  ...prev[m.id],
                                  minEfficiency: e.target.value,
                                },
                              }))
                            }
                          />
                        </td>
                        <td>
                          <button onClick={() => onUpdateThresholds(m.id)}>
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
