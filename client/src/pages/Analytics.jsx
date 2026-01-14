// src/pages/Analytics.jsx
import { useEffect, useState } from 'react'
import { socket } from '../socket/socket'
import { fetchAnalyticsSummary } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Analytics() {
  const [metrics, setMetrics] = useState({})
  const { user } = useAuth()

  async function loadMetrics() {
    try {
      const data = await fetchAnalyticsSummary()
      setMetrics(prev => ({ ...prev, ...data }))
    } catch {
      // ignore errors
    }
  }

  useEffect(() => {
    let timerId
    socket.on('metrics_update', data => setMetrics(data))
    loadMetrics()
    timerId = setInterval(loadMetrics, 5000)
    return () => {
      socket.off('metrics_update')
      clearInterval(timerId)
    }
  }, [])

  const total = Number(metrics.totalMachines || 0)
  const active = Number(metrics.active || 0)
  const avgEff = Number(metrics.avgEfficiency || 0)
  const overheat = Number(metrics.overheatCount || 0)
  const critical = Number(metrics.criticalCount || 0)

  const healthyPct = total ? Math.round(((total - critical) / total) * 100) : 0
  const utilizationPct = total ? Math.round((active / total) * 100) : 0

  const effSeries = [
    Math.max(0, avgEff - 4),
    Math.max(0, avgEff - 2),
    avgEff,
    avgEff,
  ]
  const utilSeries = [
    Math.max(0, utilizationPct - 10),
    Math.max(0, utilizationPct - 5),
    utilizationPct,
    utilizationPct,
  ]

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '16px',
        background: 'var(--page-bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1160,
          borderRadius: 18,
          padding: 18,
          background:
            'linear-gradient(135deg, var(--card-gradient-start), var(--card-gradient-end))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>Analytics</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
              Live overview of machine health and performance.
            </p>
          </div>
          <button
            onClick={loadMetrics}
            style={{
              borderRadius: 999,
              padding: '6px 14px',
              border: 'none',
              background:
                'linear-gradient(90deg, var(--accent-soft), var(--accent-pink))',
              color: '#fff',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        {/* top KPI band */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <KpiSmall label="Total" value={total} />
          <KpiSmall label="Active" value={active} />
          <KpiSmall label="Avg Eff." value={`${avgEff.toFixed?.(1) ?? avgEff}%`} />
          <KpiSmall label="Critical" value={critical} />
        </div>

        {/* row 2: gauges + latest metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <Card
              title="Overall Health"
              subtle="Non‑critical machines"
              compact
            >
              <Gauge value={healthyPct} />
            </Card>
            <Card title="Utilization" subtle="Active vs total" compact>
              <Gauge value={utilizationPct} />
            </Card>
          </div>

          <Card title="Latest Metrics" subtle="Snapshots over last ticks">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              <MiniLineBlock
                label="Efficiency"
                values={effSeries}
                max={100}
                color="var(--accent-soft)"
              />
              <MiniLineBlock
                label="Utilization"
                values={utilSeries}
                max={100}
                color="var(--accent)"
              />
            </div>
          </Card>
        </div>

        {/* row 3: bar + risk + snapshot */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}
        >
          <Card title="Efficiency Bars" subtle="Relative to 100%">
            <MiniBars
              labels={['T‑3', 'T‑2', 'T‑1', 'Now']}
              values={effSeries}
              max={100}
            />
          </Card>

          <Card title="Risk Counts" subtle="Critical vs Overheat">
            <StackedBar critical={critical} overheat={overheat} />
          </Card>

          <Card title="Snapshot" subtle="Key ratios">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 12,
                color: 'var(--muted)',
              }}
            >
              <div>
                Healthy:{' '}
                <strong style={{ color: 'var(--text)' }}>{healthyPct}%</strong>
              </div>
              <div>
                Utilization:{' '}
                <strong style={{ color: 'var(--text)' }}>{utilizationPct}%</strong>
              </div>
              <div>
                Overheat:{' '}
                <strong style={{ color: 'var(--text)' }}>{overheat}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* small KPI card */
function KpiSmall({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '8px 10px',
        background:
          'radial-gradient(circle at top left, rgba(96,165,250,0.25), transparent), var(--card-bg)',
        border: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: 54,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

/* generic card */
function Card({ title, subtle, compact, children }) {
  return (
    <section
      style={{
        borderRadius: 12,
        padding: '8px 10px',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        minHeight: compact ? 100 : 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text)',
            marginBottom: 0,
          }}
        >
          {title}
        </div>
        {subtle && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
            }}
          >
            {subtle}
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex' }}>{children}</div>
    </section>
  )
}

/* circular gauge */
function Gauge({ value }) {
  const v = Math.min(100, Math.max(0, value))
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `conic-gradient(var(--accent) ${v}%, var(--card-bg) ${v}% 100%)`,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--text)',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {v}%
      </div>
      <div
        style={{
          flex: 1,
          height: 10,
          borderRadius: 999,
          background: 'var(--card-bg)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: '100%',
            background:
              'linear-gradient(90deg, var(--accent-soft), var(--accent-pink))',
          }}
        />
      </div>
    </div>
  )
}

/* mini line-style block */
function MiniLineBlock({ label, values, max, color }) {
  const safeMax = max || Math.max(1, ...values)
  return (
    <div style={{ marginTop: 4, marginBottom: 4 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'relative',
          height: 60,
        }}
      >
        {/* baseline */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            bottom: 8,
            height: 1,
            background: 'rgba(148,163,184,0.6)',
          }}
        />
        {/* vertical bars approximating a line */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {values.map((v, i) => (
            <div
              key={i}
              style={{
                width: 12,
                borderRadius: 999,
                background: 'var(--card-bg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${(v / safeMax) * 100}%`,
                  background:
                    color ||
                    'linear-gradient(180deg,var(--accent-soft),var(--accent))',
                  transition: 'height 200ms ease',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* vertical mini bar chart with green/red logic */
function MiniBars({ labels, values, max }) {
  const safeMax = max || Math.max(1, ...values)
  const allHigh = values.every(v => v >= 70)
  const anyLow = values.some(v => v < 50)

  let barBg = 'linear-gradient(180deg,var(--accent-soft),var(--accent))'
  if (allHigh) {
    barBg = 'linear-gradient(180deg,#22c55e,#16a34a)' // green
  } else if (anyLow) {
    barBg = 'linear-gradient(180deg,#f97373,#ef4444)' // red
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        height: 80,
      }}
    >
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            color: 'var(--muted)',
          }}
        >
          <div
            style={{
              width: 14,
              borderRadius: 999,
              background: 'var(--card-bg)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${(v / safeMax) * 100}%`,
                background: barBg,
              }}
            />
          </div>
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

/* stacked bar with green / red/orange logic */
function StackedBar({ critical, overheat }) {
  const total = critical + overheat || 1
  const cPct = (critical / total) * 100
  const oPct = (overheat / total) * 100
  const allGood = critical === 0 && overheat === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          width: '100%',
          height: 20,
          borderRadius: 999,
          background: 'var(--card-bg)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {allGood ? (
          <div
            style={{
              width: '100%',
              background: 'linear-gradient(90deg,#22c55e,#16a34a)', // green
            }}
          />
        ) : (
          <>
            <div
              style={{
                width: `${cPct}%`,
                background: '#ef4444', // red for critical
              }}
            />
            <div
              style={{
                width: `${oPct}%`,
                background: '#f97316', // orange for overheat
              }}
            />
          </>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--muted)',
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: allGood ? '#22c55e' : '#ef4444',
              marginRight: 4,
            }}
          />
          Critical: {critical}
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: allGood ? '#22c55e' : '#f97316',
              marginRight: 4,
            }}
          />
          Overheat: {overheat}
        </span>
      </div>
    </div>
  )
}
