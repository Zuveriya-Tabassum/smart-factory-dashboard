import { useState } from 'react'
import { createMachine } from '../services/api'

export default function AdminCreateMachine() {
  const [name, setName] = useState('')
  const [type, setType] = useState('Conveyor')
  const [customType, setCustomType] = useState('')
  const [status, setStatus] = useState({ message: '', kind: '' }) // 'success' | 'error' | ''

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ message: '', kind: '' })

    if (!name.trim()) {
      setStatus({ message: 'Name is required', kind: 'error' })
      return
    }

    const finalType =
      type === 'Other' ? customType.trim() : type

    if (!finalType) {
      setStatus({ message: 'Machine type is required', kind: 'error' })
      return
    }

    try {
      await createMachine({ name: name.trim(), type: finalType })
      setStatus({ message: 'Machine created successfully', kind: 'success' })
      setName('')
      setType('Conveyor')
      setCustomType('')
    } catch (err) {
      setStatus({
        message: err.message || 'Failed to create machine',
        kind: 'error',
      })
    }
  }

 return (
  <div
    style={{
      minHeight: 'calc(100vh - 60px)', // 60px ≈ navbar height
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '82px 16px 32px',
    }}
  >
    <div
      style={{
        maxWidth: 800,
        width: '100%',
        padding: '24px 28px',
        borderRadius: 16,
        background: 'var(--card-bg)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        border: '1px solid var(--card-border)',
      }}
    >
      <h2 style={{ marginBottom: 4 }}>Create New Machine</h2>
      <p style={{ marginTop: 0, color: 'var(--muted)' }}>
        Add a machine and optionally define a custom type when needed.
      </p>

      {status.message && (
        <p
          className={`toast ${
            status.kind === 'error' ? 'toast-error' : 'toast-success'
          }`}
          style={{ marginTop: 12 }}
        >
          {status.message}
        </p>
      )}

      <form
        onSubmit={onSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: 12,
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <input
          placeholder="Machine name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ padding: '8px 10px' }}
        />

        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ padding: '8px 10px' }}
        >
          <option value="Conveyor">Conveyor</option>
          <option value="Robot">Robot</option>
          <option value="Press">Press</option>
          <option value="Other">Other</option>
        </select>

        <button type="submit">Create</button>

        {type === 'Other' && (
          <input
            placeholder="Enter custom machine type"
            value={customType}
            onChange={e => setCustomType(e.target.value)}
            style={{
              gridColumn: '1 / span 3',
              padding: '8px 10px',
            }}
          />
        )}
      </form>
    </div>
  </div>
)
}
