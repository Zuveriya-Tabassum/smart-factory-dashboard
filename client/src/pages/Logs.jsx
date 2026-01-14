// src/pages/Logs.jsx
import { useEffect, useState } from 'react'
import { fetchLogs } from '../services/api'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  // server-side filters
  const [filters, setFilters] = useState({
    machineId: '',
    from: '',
    to: '',
  })

  // client-side extra filters
  const [machineNameFilter, setMachineNameFilter] = useState('')
  const [machineTypeFilter, setMachineTypeFilter] = useState('')

  async function refresh(p = page) {
    try {
      const { fetchLogs } = await import('../services/api')
      const res = await fetchLogs(p, limit, {
        machineId: filters.machineId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      })
      setLogs(res.data || [])
      setTotal(res.total || 0)
    } catch (err) {
      setError(err.message || 'Failed to load logs')
    }
  }

  useEffect(() => {
    refresh(page)
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  function onExport() {
    ;(async () => {
      try {
        const { exportLogsCsv } = await import('../services/api')
        const blob = await exportLogsCsv({
          machineId: filters.machineId || undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'logs.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        setError(err.message || 'Export failed')
      }
    })()
  }

  // client-side filtering by machine name / type
  const filteredLogs = logs.filter(l => {
    const name = (l.Machine?.name || '').toLowerCase()
    const type = (l.Machine?.type || '').toLowerCase()
    const nf = machineNameFilter.trim().toLowerCase()
    const tf = machineTypeFilter.trim().toLowerCase()

    if (nf && !name.includes(nf)) return false
    if (tf && !type.includes(tf)) return false
    return true
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
          maxWidth: 1100,
          background: 'var(--card-bg)',
          borderRadius: 16,
          border: '1px solid var(--card-border)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
          padding: '20px 24px 28px',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Logs</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              History of machine operations and control actions.
            </p>
          </div>
          <button
            onClick={onExport}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(90deg,#2563eb,#1d4ed8)',
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Export CSV
          </button>
        </header>

        {error && (
          <p className="toast toast-error" style={{ marginBottom: 12 }}>
            Error: {error}
          </p>
        )}

        {/* Filters row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, max-content))',
            gap: 8,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <input
            placeholder="Machine ID"
            value={filters.machineId}
            onChange={e =>
              setFilters(prev => ({ ...prev, machineId: e.target.value }))
            }
            style={{
              padding: '6px 8px',
              borderRadius: 999,
              border: '1px solid var(--card-border)',
              fontSize: 12,
            }}
          />
          <input
            type="datetime-local"
            value={filters.from}
            onChange={e =>
              setFilters(prev => ({ ...prev, from: e.target.value }))
            }
            style={{
              padding: '6px 8px',
              borderRadius: 999,
              border: '1px solid var(--card-border)',
              fontSize: 12,
            }}
          />
          <input
            type="datetime-local"
            value={filters.to}
            onChange={e =>
              setFilters(prev => ({ ...prev, to: e.target.value }))
            }
            style={{
              padding: '6px 8px',
              borderRadius: 999,
              border: '1px solid var(--card-border)',
              fontSize: 12,
            }}
          />
          <input
            placeholder="Filter by machine name"
            value={machineNameFilter}
            onChange={e => setMachineNameFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: 999,
              border: '1px solid var(--card-border)',
              fontSize: 12,
            }}
          />
          <input
            placeholder="Filter by machine type"
            value={machineTypeFilter}
            onChange={e => setMachineTypeFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: 999,
              border: '1px solid var(--card-border)',
              fontSize: 12,
            }}
          />
          <button
            onClick={() => {
              setPage(1)
              refresh(1)
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid var(--card-border)',
              background: 'rgba(15,23,42,0.7)',
              color: '#e5e7eb',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Apply Filters
          </button>
        </div>

        {/* Table */}
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.5)',
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
                  Timestamp
                </th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                  Machine Name
                </th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                  Machine
                </th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(l => (
                <tr
                  key={`${l.machineId}-${l.timestamp}-${l.action}`}
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
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>
                    {l.Machine ? l.Machine.name : '—'}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>
                    {l.Machine
                      ? `${l.Machine.name} (${l.Machine.type})`
                      : l.machineId}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 13 }}>
                    {l.action}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '10px',
                      fontSize: 13,
                      textAlign: 'center',
                    }}
                  >
                    No logs found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={{ fontSize: 13 }}>
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
