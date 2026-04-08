import { useState } from 'react'

const ICONS = {
  init: (
    <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3M3.5 3.5l2 2M10.5 10.5l2 2M3.5 12.5l2-2M10.5 5.5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  ),
  expand: (
    <path d="M3 8h10M9 4l4 4-4 4M3 4v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  embed: (
    <path d="M2 8a6 6 0 1112 0 6 6 0 01-12 0zM8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  ),
  retrieve: (
    <path d="M7 2a5 5 0 104 8l3 3M7 2a5 5 0 015 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  rerank: (
    <path d="M3 4h10M3 8h7M3 12h4M11 10l2 2 2-2M13 12V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  prompt: (
    <path d="M2 3h12v8H6l-3 3V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
  ),
  llm: (
    <path d="M8 2l1.8 3.6L14 6.5l-3 2.9L11.6 14 8 12.1 4.4 14 5 9.4 2 6.5l4.2-.9L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  ),
  suggest: (
    <path d="M8 1.5a5 5 0 00-3 9v1.5h6V10.5a5 5 0 00-3-9zM6 14h4M7 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
  default: (
    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 4v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  ),
}

const STATUS_COLORS = {
  ok:      { bar: '#10b981', glow: 'rgba(16,185,129,0.18)', label: 'OK' },
  warn:    { bar: '#f59e0b', glow: 'rgba(245,158,11,0.18)', label: 'WARN' },
  error:   { bar: '#ef4444', glow: 'rgba(239,68,68,0.18)',  label: 'ERROR' },
  running: { bar: '#6366f1', glow: 'rgba(99,102,241,0.22)', label: '...' },
}

function StepIcon({ kind }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      {ICONS[kind] || ICONS.default}
    </svg>
  )
}

function formatDuration(ms) {
  if (ms == null) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export default function ExecutionTrace({ trace }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState({})
  if (!trace?.length) return null

  const totalMs = trace.reduce((acc, s) => acc + (s.durationMs || 0), 0)
  const hasError = trace.some(s => s.status === 'error')

  return (
    <div style={styles.wrap}>
      <button type="button" onClick={() => setOpen(o => !o)} style={styles.toggle}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 4v4l2.5 2.5"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Execution trace</span>
        <span style={styles.badge}>{trace.length} step{trace.length !== 1 ? 's' : ''}</span>
        {totalMs > 0 && <span style={styles.timeBadge}>{formatDuration(totalMs)}</span>}
        {hasError && <span style={{ ...styles.timeBadge, background: 'rgba(239,68,68,0.18)', color: '#fca5a5' }}>error</span>}
      </button>

      {open && (
        <ol style={styles.list}>
          {trace.map((step, i) => {
            const kind = typeof step === 'object' ? step.kind : null
            const label = typeof step === 'object' ? step.label : null
            const detail = typeof step === 'string'
              ? step
              : (step.detail || step.message || '')
            const status = (typeof step === 'object' && step.status) || 'ok'
            const colors = STATUS_COLORS[status] || STATUS_COLORS.ok
            const duration = typeof step === 'object' ? formatDuration(step.durationMs) : null
            const meta = typeof step === 'object' ? step.meta : null
            const hasMeta = meta && (Array.isArray(meta) ? meta.length > 0 : Object.keys(meta).length > 0)
            const isExpanded = !!expanded[i]
            const isLast = i === trace.length - 1

            return (
              <li key={i} style={styles.step}>
                <div style={styles.timelineCol}>
                  <div style={{ ...styles.iconCircle, background: colors.bar, boxShadow: `0 0 0 4px ${colors.glow}` }}>
                    <StepIcon kind={kind} />
                  </div>
                  {!isLast && <div style={styles.connector} />}
                </div>

                <div style={styles.stepBody}>
                  <div style={styles.stepHeader}>
                    <span style={styles.stepLabel}>{label || `Step ${i + 1}`}</span>
                    <span style={{ ...styles.statusPill, color: colors.bar, background: colors.glow }}>
                      {colors.label}
                    </span>
                    {duration && <span style={styles.duration}>{duration}</span>}
                  </div>
                  {detail && <div style={styles.stepDetail}>{detail}</div>}

                  {hasMeta && (
                    <>
                      <button
                        type="button"
                        style={styles.metaToggle}
                        onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                      >
                        {isExpanded ? '− Hide details' : '+ Show details'}
                      </button>
                      {isExpanded && (
                        <pre style={styles.metaBlock}>
                          {JSON.stringify(meta, null, 2)}
                        </pre>
                      )}
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    marginTop: 10,
    borderRadius: 10,
    border: '1px solid rgba(99,102,241,0.18)',
    background: 'rgba(99,102,241,0.06)',
    overflow: 'hidden',
  },
  toggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 12px',
    background: 'transparent',
    border: 'none',
    color: '#a5b4fc',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 0.2,
  },
  badge: {
    marginLeft: 'auto',
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(99,102,241,0.18)',
    color: '#c7d2fe',
  },
  timeBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    background: 'rgba(16,185,129,0.15)',
    color: '#6ee7b7',
    fontFamily: 'ui-monospace, monospace',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: '14px 14px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    borderTop: '1px solid rgba(99,102,241,0.12)',
  },
  step: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 0,
    minHeight: 50,
  },
  timelineCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  connector: {
    flex: 1,
    width: 2,
    background: 'linear-gradient(to bottom, rgba(99,102,241,0.35), rgba(99,102,241,0.1))',
    marginTop: 4,
    minHeight: 24,
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 16,
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  stepLabel: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#e0e7ff',
    letterSpacing: 0.2,
  },
  statusPill: {
    fontSize: 9.5,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    letterSpacing: 0.5,
    fontFamily: 'ui-monospace, monospace',
  },
  duration: {
    fontSize: 10.5,
    fontWeight: 600,
    color: 'rgba(165,180,252,0.7)',
    fontFamily: 'ui-monospace, monospace',
    marginLeft: 'auto',
  },
  stepDetail: {
    fontSize: 12,
    color: 'rgba(226,232,240,0.78)',
    lineHeight: 1.55,
    wordBreak: 'break-word',
  },
  metaToggle: {
    marginTop: 6,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'ui-monospace, monospace',
  },
  metaBlock: {
    marginTop: 6,
    padding: '8px 10px',
    borderRadius: 6,
    background: 'rgba(15,15,19,0.7)',
    border: '1px solid rgba(99,102,241,0.15)',
    color: 'rgba(199,210,254,0.85)',
    fontSize: 10.5,
    fontFamily: 'ui-monospace, monospace',
    overflow: 'auto',
    maxHeight: 200,
    margin: '6px 0 0 0',
    whiteSpace: 'pre',
  },
}
