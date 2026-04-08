import { useState, useEffect, useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'

const MAX_DOCS = 5
const ACCEPT   = '.pdf,.txt,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp'

export default function Chat({ indexed, indexedFiles = [], messages, asking, uploading, onAsk, onUpload, onRegenerate, onMenuClick, token, filterFile, onFilterChange, onTrimMessages }) {
  const [input, setInput]               = useState('')
  const [dragOver, setDragOver]         = useState(false)
  const [uploadError, setUploadError]   = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showScrollBtn, setShowScrollBtn]   = useState(false)
  const [editingIndex, setEditingIndex]     = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const messagesEndRef   = useRef(null)
  const messagesBoxRef   = useRef(null)
  const textareaRef      = useRef(null)
  const editTextareaRef  = useRef(null)
  const fileInputRef     = useRef(null)
  const scrollTimerRef   = useRef(null)
  const prevLengthRef    = useRef(messages.length)

  // Returns true if user has scrolled more than 120px from the bottom
  function isScrolledUp() {
    const el = messagesBoxRef.current
    if (!el) return false
    return el.scrollHeight - el.scrollTop - el.clientHeight > 120
  }

  // Debounced smooth scroll — cancels any queued scroll before starting a new one
  const scrollToBottom = useCallback((force = false) => {
    if (!force && isScrolledUp()) return
    clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      const el = messagesBoxRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 30)
  }, [])

  const handleScroll = useCallback(() => {
    setShowScrollBtn(isScrolledUp())
  }, [])

  // Auto-scroll on new assistant content (skip if user is reading history)
  useEffect(() => {
    scrollToBottom()
  }, [messages, asking, scrollToBottom])

  // Force-scroll whenever the user sends a new message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (messages.length > prevLengthRef.current && lastMsg?.role === 'user') {
      scrollToBottom(true)
    }
    prevLengthRef.current = messages.length
  }, [messages, scrollToBottom])

  function handleInputChange(e) {
    setInput(e.target.value)
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit() {
    const q = input.trim()
    if (!q || !indexed || asking) return
    onAsk(q)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleEditClick(index, content) {
    setEditingIndex(index)
    setEditingContent(content)
    // focus after render
    setTimeout(() => {
      const ta = editTextareaRef.current
      if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length }
    }, 0)
  }

  function handleEditCancel() {
    setEditingIndex(null)
    setEditingContent('')
  }

  function handleEditSubmit(index) {
    const content = editingContent.trim()
    if (!content) return
    setEditingIndex(null)
    setEditingContent('')
    if (onTrimMessages) onTrimMessages(index)   // trim from this index onward
    onAsk(content)
  }

  function handleEditKeyDown(e, index) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(index) }
    if (e.key === 'Escape') handleEditCancel()
  }

  // ── File upload helpers ──────────────────────────────────────────────

  function validateAndUpload(files) {
    setUploadError('')
    const accepted = Array.from(files).filter(f => /\.(pdf|txt|xlsx|xls|png|jpe?g|gif|webp)$/i.test(f.name))
    if (accepted.length === 0) {
      setUploadError('Please select a PDF, TXT, Excel, or image file (PNG, JPG, GIF, WEBP).')
      return
    }
    const remaining = MAX_DOCS - indexedFiles.length
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_DOCS} documents already indexed.`)
      return
    }
    if (accepted.length > remaining) {
      setUploadError(`Only ${remaining} more file(s) can be added (limit ${MAX_DOCS}).`)
      return
    }
    setUploadProgress(0)
    onUpload(accepted, (pct) => setUploadProgress(pct))
  }

  function handleFileChange(e) {
    if (e.target.files?.length) {
      validateAndUpload(e.target.files)
      e.target.value = ''
    }
  }

  function openFilePicker() {
    if (uploading) return
    fileInputRef.current?.click()
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    validateAndUpload(e.dataTransfer.files)
  }

  const canSend   = input.trim().length > 0 && indexed && !asking
  const slotsLeft = MAX_DOCS - indexedFiles.length

  return (
    <div
      className={`chat-container${dragOver ? ' drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Drag overlay */}
      {dragOver && (
        <div className="chat-drop-overlay">
          <div className="chat-drop-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Drop file{slotsLeft !== 1 ? 's' : ''} here</span>
          </div>
        </div>
      )}

      <div className="chat-mobile-header">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Open sidebar">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14"/>
          </svg>
        </button>
        <span className="chat-mobile-title">DocuChat AI</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="chat-messages" ref={messagesBoxRef} onScroll={handleScroll}>
        {messages.length === 0 && !asking ? (
          <div className="chat-empty">
            {/* Icon */}
            <div className="empty-icon-wrap">
              <div className="empty-icon-glow" />
              <svg className="empty-icon-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="6" width="35" height="44" rx="5" fill="url(#docFill)" stroke="url(#docStroke)" strokeWidth="1.5"/>
                <path d="M10 17h35" stroke="url(#docStroke)" strokeWidth="1" opacity="0.4"/>
                <path d="M18 28h20M18 35h20M18 42h12" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="48" cy="46" r="10" fill="url(#badgeFill)"/>
                <path d="M44.5 46l2.5 2.5 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="docFill" x1="10" y1="6" x2="45" y2="50" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" stopOpacity="0.12"/>
                    <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.06"/>
                  </linearGradient>
                  <linearGradient id="docStroke" x1="10" y1="6" x2="45" y2="50" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818cf8"/>
                    <stop offset="1" stopColor="#a78bfa"/>
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="18" y1="28" x2="38" y2="42" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818cf8" stopOpacity="0.7"/>
                    <stop offset="1" stopColor="#a78bfa" stopOpacity="0.5"/>
                  </linearGradient>
                  <linearGradient id="badgeFill" x1="38" y1="36" x2="58" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#7c3aed"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {indexed ? (
              <>
                <p className="chat-empty-title">Ready to answer your questions</p>
                <p className="chat-empty-sub">Your documents are indexed. Ask anything — I'll find the answer from your documents.</p>
                <div className="chat-empty-chips">
                  <span className="chip">Summarize the document</span>
                  <span className="chip">What are the key points?</span>
                  <span className="chip">Find specific data</span>
                </div>
              </>
            ) : uploading ? (
              <>
                <p className="chat-empty-title">Indexing your document…</p>
                <p className="chat-empty-sub">Parsing, chunking and embedding — this takes a few seconds.</p>
                <div className="chat-upload-progress">
                  <span className="spinner" style={{ borderTopColor: '#6366f1', borderColor: 'rgba(99,102,241,0.25)', width: 18, height: 18 }} />
                  <span>Processing…</span>
                </div>
                {uploading && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="upload-progress-bar-wrap">
                    <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                    <span className="upload-progress-label">{uploadProgress}%</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="chat-empty-title">Upload a document to get started</p>
                <p className="chat-empty-sub">Drop a PDF, TXT, Excel, or image file anywhere, or click below to browse. I'll index it automatically.</p>

                {/* Drop / pick zone */}
                <button
                  className="chat-upload-zone"
                  onClick={openFilePicker}
                  disabled={uploading}
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Click to upload document</span>
                  <span className="chat-upload-zone-sub">or drag &amp; drop anywhere · PDF, TXT, Excel, Images · up to {MAX_DOCS} files</span>
                </button>

                {uploadError && <p className="chat-upload-error">{uploadError}</p>}

                <div className="chat-empty-chips">
                  <span className="chip">Up to 5 documents</span>
                  <span className="chip">Ask across all docs</span>
                  <span className="chip">Source citations</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
              const prevUserMsg = isLastAssistant ? [...messages].slice(0, i).reverse().find(m => m.role === 'user') : null
              return (
                <div key={i}>
                  <div className={`message-row ${msg.role}`}>
                    {msg.role === 'user' ? (
                      <div className="user-msg-wrap">
                        {editingIndex === i ? (
                          <div className="edit-inline-box">
                            <textarea
                              ref={editTextareaRef}
                              className="edit-inline-textarea"
                              value={editingContent}
                              onChange={e => setEditingContent(e.target.value)}
                              onKeyDown={e => handleEditKeyDown(e, i)}
                              rows={1}
                            />
                            <div className="edit-inline-actions">
                              <button className="edit-cancel-btn" onClick={handleEditCancel}>Cancel</button>
                              <button
                                className="edit-send-btn"
                                onClick={() => handleEditSubmit(i)}
                                disabled={!editingContent.trim()}
                              >Send</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {!asking && editingIndex === null && (
                              <div className="user-msg-actions">
                                <button
                                  className="edit-msg-btn"
                                  onClick={() => handleEditClick(i, msg.content)}
                                >
                                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                                    <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z"/>
                                  </svg>
                                  Edit
                                </button>
                              </div>
                            )}
                            <MessageBubble message={msg} onSuggestionClick={onAsk} />
                          </>
                        )}
                      </div>
                    ) : (
                      <MessageBubble message={msg} onSuggestionClick={onAsk} />
                    )}
                  </div>
                  {isLastAssistant && !asking && prevUserMsg && (
                    <div className="regenerate-row">
                      <button className="regenerate-btn" onClick={() => onRegenerate(prevUserMsg.content)}>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                          <path d="M14 8A6 6 0 1 1 8 2a6 6 0 0 1 4.24 1.76L14 5.5"/>
                          <polyline points="14 2 14 5.5 10.5 5.5"/>
                        </svg>
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {asking && (
              <div className="message-row assistant">
                <div className="bubble assistant">
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          className="scroll-to-bottom-btn"
          onClick={() => { setShowScrollBtn(false); scrollToBottom(true) }}
          aria-label="Scroll to bottom"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <path d="M8 3v10M3 9l5 5 5-5"/>
          </svg>
        </button>
      )}

      {/* Input bar */}
      <div className="chat-input-bar">
        {uploadError && indexed && <p className="chat-upload-error" style={{ marginBottom: 6 }}>{uploadError}</p>}
        {indexed && indexedFiles.length > 1 && onFilterChange && (
          <div className="chat-filter-bar">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ opacity: 0.6 }}>
              <path d="M2 4h12M4 8h8M6 12h4"/>
            </svg>
            <span className="chat-filter-label">Scope:</span>
            <select
              className="chat-filter-select"
              value={filterFile || ''}
              onChange={e => onFilterChange(e.target.value || null)}
            >
              <option value="">All documents</option>
              {indexedFiles.map(item => {
                const name = typeof item === 'string' ? item : item.name
                return <option key={name} value={name}>{name}</option>
              })}
            </select>
          </div>
        )}
        <div className={`chat-input-inner ${!indexed || asking ? 'disabled' : ''}`}>
          {/* Attach button */}
          <button
            className="attach-btn"
            onClick={openFilePicker}
            disabled={uploading || slotsLeft <= 0}
            title={slotsLeft <= 0 ? `Maximum ${MAX_DOCS} documents reached` : 'Attach file'}
            type="button"
          >
            {uploading ? (
              <span className="spinner" style={{ borderTopColor: '#6366f1', borderColor: 'rgba(99,102,241,0.25)', width: 13, height: 13 }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41A2 2 0 0 1 6.59 14.59l8.49-8.49"/>
              </svg>
            )}
          </button>

          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            placeholder={
              !indexed
                ? 'Upload a document to start asking questions…'
                : asking
                ? 'Waiting for response…'
                : 'Ask anything about your documents…'
            }
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!indexed || asking}
          />
          <button
            className="send-btn"
            onClick={handleSubmit}
            disabled={!canSend}
            title="Send (Enter)"
          >
            {asking ? (
              <span className="spinner" style={{ borderTopColor: '#6366f1', borderColor: 'rgba(99,102,241,0.25)', width: 14, height: 14 }} />
            ) : (
              <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
