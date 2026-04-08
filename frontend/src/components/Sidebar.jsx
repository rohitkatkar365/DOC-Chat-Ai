import { useState, useRef, useEffect } from 'react'

const CHAIN_OPTIONS = [
  { value: 'stuff',      label: 'Stuff',       icon: '⚡', desc: 'All chunks in one prompt' },
  { value: 'map_reduce', label: 'Map Reduce',  icon: '🗺️', desc: 'Process then combine' },
  { value: 'refine',     label: 'Refine',      icon: '✨', desc: 'Iteratively refines answer' },
  { value: 'map_rerank', label: 'Map Rerank',  icon: '🏆', desc: 'Score & rank chunks' },
]

const MODEL_OPTIONS = [
  { value: 'openai/gpt-4o-mini',           label: 'GPT-4o Mini',      icon: '⚡', desc: 'Fast & cost-effective' },
  { value: 'openai/gpt-4o',                label: 'GPT-4o',           icon: '🧠', desc: 'Best OpenAI model' },
  { value: 'anthropic/claude-3.5-sonnet',  label: 'Claude 3.5 Sonnet',icon: '✦',  desc: 'Excellent reasoning' },
  { value: 'google/gemini-2.5-flash',        label: 'Gemini 2.5 Flash', icon: '💫', desc: 'Fast & multimodal' },
]

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SummaryTooltip({ summary }) {
  const [visible, setVisible] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const wrapRef = useRef(null)
  const hideTimer = useRef(null)

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setVisible(false), 120)
  }

  function cancelHide() {
    clearTimeout(hideTimer.current)
  }

  function handleMouseEnter() {
    cancelHide()
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceAbove > spaceBelow && spaceAbove > 200)
    }
    setVisible(true)
  }

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  return (
    <span
      ref={wrapRef}
      className="pdf-item-summary-wrap"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleHide}
    >
      <span className="pdf-item-summary">{summary}</span>
      {visible && (
        <span
          className={`pdf-item-summary-tooltip${openUp ? ' pdf-item-summary-tooltip--up' : ' pdf-item-summary-tooltip--down'}`}
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
        >
          <span className="pdf-item-summary-tooltip-label">Summary</span>
          {summary}
        </span>
      )}
    </span>
  )
}

export default function Sidebar({
  indexed,
  indexedFiles,
  uploading,
  settings,
  isOpen,
  onSettingsChange,
  onUpload,
  onClearChat,
  onRemoveFile,
  onRemoveIndex,
  onExportChat,
  onClose
}) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [limitError, setLimitError] = useState('')
  const [chainOpen, setChainOpen] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const fileInputRef = useRef(null)
  const chainRef = useRef(null)
  const modelRef = useRef(null)
  const MAX_DOCS = 5

  useEffect(() => {
    function handleClickOutside(e) {
      if (chainRef.current && !chainRef.current.contains(e.target)) setChainOpen(false)
      if (modelRef.current && !modelRef.current.contains(e.target)) setModelOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const currentCount = indexedFiles ? indexedFiles.length : 0
    if (currentCount + files.length > MAX_DOCS) {
      setLimitError(`Only ${MAX_DOCS - currentCount} slot(s) remaining (${MAX_DOCS} document limit).`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setLimitError('')
    if (settings.autoIndex) {
      onUpload(files)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      setSelectedFiles(files)
    }
  }

  function handleIndexClick() {
    if (selectedFiles.length && !uploading) {
      onUpload(selectedFiles)
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const slotsFull = indexedFiles && indexedFiles.length >= MAX_DOCS

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">📄</div>
          <div>
            <div className="sidebar-title">DocuChat AI</div>
            <div className="sidebar-caption">AI Document Intelligence</div>
          </div>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13"/>
          </svg>
        </button>
      </div>

      {/* Status */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Index Status</div>
        {indexed ? (
          <span className="status-badge ready">
            <span className="status-dot" /> Index ready · {indexedFiles?.length ?? 0} document{indexedFiles?.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="status-badge not-ready">
            <span className="status-dot" /> No documents loaded
          </span>
        )}
      </div>

      {/* Indexed PDFs list */}
      {indexedFiles && indexedFiles.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-label">Indexed Documents ({indexedFiles.length}/{MAX_DOCS})</div>
          <div className="pdf-list">
            {indexedFiles.map(item => {
              const name = typeof item === 'string' ? item : item.name
              const size = typeof item === 'object' && item.size ? formatFileSize(item.size) : null
              const date = typeof item === 'object' && item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString() : null
              const summary = typeof item === 'object' ? item.summary : null
              return (
                <div key={name} className="pdf-item">
                  <span className="pdf-item-icon">{/\.xlsx?$/i.test(name) ? '📊' : /\.txt$/i.test(name) ? '📝' : /\.(png|jpe?g|gif|webp)$/i.test(name) ? '🖼️' : '📄'}</span>
                  <div className="pdf-item-info">
                    <span className="pdf-item-name">{name}</span>
                    {(size || date) && <span className="pdf-item-meta">{[size, date].filter(Boolean).join(' · ')}</span>}
                    {summary && <SummaryTooltip summary={summary} />}
                  </div>
                  <button className="pdf-item-remove" onClick={() => onRemoveFile(name)} title={`Remove ${name}`}>×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload */}
      {/* <div className="sidebar-section">
        <div className="sidebar-section-label">Upload Documents</div>
        <div className="upload-area">
          <label className={`file-input-label ${selectedFiles.length ? 'has-file' : ''} ${slotsFull ? 'disabled' : ''}`}>
            <span className="file-icon">{slotsFull ? '🚫' : '📁'}</span>
            <span className="file-name">
              {slotsFull
                ? `Limit reached (${MAX_DOCS}/${MAX_DOCS} documents)`
                : selectedFiles.length === 0
                  ? 'Choose file(s)… (PDF, TXT, Excel, Image)'
                  : selectedFiles.length === 1
                    ? selectedFiles[0].name
                    : `${selectedFiles.length} files selected`}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp"
              multiple
              onChange={handleFileChange}
              disabled={uploading || slotsFull}
            />
          </label>
          {limitError && <p className="upload-error">{limitError}</p>}
          <button
            className="btn btn-primary"
            onClick={handleIndexClick}
            disabled={!selectedFiles.length || uploading || slotsFull}
          >
            {uploading ? (
              <><span className="spinner" /> Indexing…</>
            ) : (
              <><span>⚡</span> Index {selectedFiles.length > 1 ? `${selectedFiles.length} files` : 'this file'}</>
            )}
          </button>
        </div>
      </div> */}

      {/* Settings */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Settings</div>

        <div className="setting-row">
          <label className="setting-label">
            <span>Retrieved chunks (k)</span>
            <span className="setting-value">{settings.k}</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={1} max={8} step={1}
            value={settings.k}
            onChange={e => onSettingsChange('k', Number(e.target.value))}
          />
        </div>

        <div className="setting-row">
          <label className="setting-label">
            <span>Relevance threshold</span>
            <span className="setting-value">{settings.relevanceThreshold ?? 0.3}</span>
          </label>
          <input
            type="range"
            className="range-slider"
            min={0} max={1} step={0.05}
            value={settings.relevanceThreshold ?? 0.3}
            onChange={e => onSettingsChange('relevanceThreshold', Number(e.target.value))}
          />
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <span>Auto-index on select</span>
            <div
              className={`toggle ${settings.autoIndex ? 'on' : ''}`}
              onClick={() => onSettingsChange('autoIndex', !settings.autoIndex)}
            />
          </div>
        </div>

        <div className="setting-row" ref={chainRef}>
          <label className="setting-label"><span>Chain type</span></label>
          <div className={`chain-dropdown ${chainOpen ? 'open' : ''}`}>
            <button
              className="chain-trigger"
              onClick={() => setChainOpen(o => !o)}
              type="button"
            >
              {(() => {
                const opt = CHAIN_OPTIONS.find(o => o.value === settings.chainType)
                return (
                  <>
                    <span className="chain-trigger-icon">{opt?.icon}</span>
                    <span className="chain-trigger-label">{opt?.label}</span>
                    <svg className="chain-chevron" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )
              })()}
            </button>
            {chainOpen && (
              <div className="chain-menu">
                {CHAIN_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`chain-option ${settings.chainType === opt.value ? 'active' : ''}`}
                    onClick={() => { onSettingsChange('chainType', opt.value); setChainOpen(false) }}
                    type="button"
                  >
                    <span className="chain-opt-icon">{opt.icon}</span>
                    <span className="chain-opt-text">
                      <span className="chain-opt-label">{opt.label}</span>
                      <span className="chain-opt-desc">{opt.desc}</span>
                    </span>
                    {settings.chainType === opt.value && (
                      <svg className="chain-check" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="setting-row" ref={modelRef}>
          <label className="setting-label"><span>Model</span></label>
          <div className={`chain-dropdown ${modelOpen ? 'open' : ''}`}>
            <button
              className="chain-trigger"
              onClick={() => setModelOpen(o => !o)}
              type="button"
            >
              {(() => {
                const opt = MODEL_OPTIONS.find(o => o.value === (settings.model || 'openai/gpt-4o-mini'))
                return (
                  <>
                    <span className="chain-trigger-icon">{opt?.icon}</span>
                    <span className="chain-trigger-label">{opt?.label}</span>
                    <svg className="chain-chevron" viewBox="0 0 12 12" fill="none">
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )
              })()}
            </button>
            {modelOpen && (
              <div className="chain-menu">
                {MODEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`chain-option ${(settings.model || 'openai/gpt-4o-mini') === opt.value ? 'active' : ''}`}
                    onClick={() => { onSettingsChange('model', opt.value); setModelOpen(false) }}
                    type="button"
                  >
                    <span className="chain-opt-icon">{opt.icon}</span>
                    <span className="chain-opt-text">
                      <span className="chain-opt-label">{opt.label}</span>
                      <span className="chain-opt-desc">{opt.desc}</span>
                    </span>
                    {(settings.model || 'openai/gpt-4o-mini') === opt.value && (
                      <svg className="chain-check" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-label">
            <span>Query expansion</span>
            <div
              className={`toggle ${settings.queryExpansion ? 'on' : ''}`}
              onClick={() => onSettingsChange('queryExpansion', !settings.queryExpansion)}
              title="Generate alternative phrasings for better retrieval"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={onExportChat} disabled={!indexed}>
            Export chat (.md)
          </button>
          <button className="btn btn-secondary" onClick={onClearChat}>
            Clear chat history
          </button>
          <button className="btn btn-danger" onClick={onRemoveIndex} disabled={!indexed}>
            Remove index
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="how-it-works">
        <div className="how-it-works-title">How it works</div>
        <ol className="steps-list">
          {[
            'Upload up to 5 documents (PDF, TXT, Excel, or Images) — each is split into overlapping text chunks.',
            'Chunks are embedded with OpenAI and merged into a shared vector index.',
            'Your question is embedded and the top-k most similar chunks are retrieved (optionally with query expansion).',
            'LangChain passes the chunks + question to the chosen chain type and model.',
            'The LLM streams an answer and returns source citations.'
          ].map((text, i) => (
            <li key={i} className="step-item">
              <span className="step-num">{i + 1}</span>
              <span className="step-text">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  )
}
