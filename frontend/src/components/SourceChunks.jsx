import { useState } from 'react'

export default function SourceChunks({ sources }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState({})
  if (!sources?.length) return null

  function toggleChunk(i) {
    setExpanded(e => ({ ...e, [i]: !e[i] }))
  }

  return (
    <div style={styles.wrap}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={styles.toggle}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M3 2h7l3 3v9H3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M10 2v3h3M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Sources</span>
        <span style={styles.badge}>{sources.length}</span>
      </button>

      {open && (
        <div style={styles.list}>
          {sources.map((s, i) => {
            const text = typeof s === 'string' ? s : (s.text || s.content || '')
            const name = typeof s === 'object' ? s.source : null
            const page = typeof s === 'object' ? s.page : null
            const score = typeof s === 'object' && typeof s.score === 'number' ? s.score : null
            const isExpanded = !!expanded[i]
            const preview = text.length > 240 && !isExpanded ? text.slice(0, 240) + '…' : text

            return (
              <div key={i} style={styles.chunk}>
                <div style={styles.chunkHeader}>
                  <span style={styles.chunkIndex}>{i + 1}</span>
                  {name && (
                    <span style={styles.chunkSource} title={name}>
                      {name}{page != null ? ` · p.${page}` : ''}
                    </span>
                  )}
                  {score != null && (
                    <span style={styles.chunkScore}>{score.toFixed(2)}</span>
                  )}
                </div>
                <div style={styles.chunkText}>{preview}</div>
                {text.length > 240 && (
                  <button
                    type="button"
                    style={styles.expandBtn}
                    onClick={() => toggleChunk(i)}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    marginTop: 8,
    borderRadius: 10,
    border: '1px solid rgba(139,92,246,0.18)',
    background: 'rgba(139,92,246,0.06)',
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
    color: '#c4b5fd',
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
    background: 'rgba(139,92,246,0.2)',
    color: '#ddd6fe',
  },
  list: {
    padding: '4px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderTop: '1px solid rgba(139,92,246,0.12)',
  },
  chunk: {
    padding: '10px 12px',
    borderRadius: 8,
    background: 'rgba(15,15,19,0.5)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  chunkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chunkIndex: {
    flexShrink: 0,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    color: 'white',
    fontSize: 10.5,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chunkSource: {
    fontSize: 11.5,
    fontWeight: 600,
    color: '#e0e7ff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  },
  chunkScore: {
    fontSize: 10.5,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 4,
    background: 'rgba(16,185,129,0.15)',
    color: '#6ee7b7',
    fontFamily: 'ui-monospace, monospace',
  },
  chunkText: {
    fontSize: 12,
    color: 'rgba(226,232,240,0.78)',
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  expandBtn: {
    marginTop: 6,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: '#a78bfa',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
}
