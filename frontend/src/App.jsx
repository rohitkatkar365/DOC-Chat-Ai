import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import Login from './components/Login'
import Register from './components/Register'
import { useAuth } from './context/AuthContext'

const API = '/api'

function MainApp() {
  const { user, logout, authFetch, token } = useAuth()
  const [indexed, setIndexed]           = useState(false)
  const [indexedFiles, setIndexedFiles] = useState([])  // { name, size, uploadedAt, summary }[]
  const [messages, setMessages]         = useState([])
  const [uploading, setUploading]       = useState(false)
  const [asking, setAsking]             = useState(false)
  const isMobile = () => window.innerWidth <= 768
  const [sidebarOpen, setSidebarOpen]   = useState(() => window.innerWidth > 768)

  // Settings persistence
  const [settings, setSettings] = useState(() => {
    const defaults = { k: 4, chainType: 'stuff', autoIndex: false, relevanceThreshold: 0.3, model: 'openai/gpt-4o-mini', queryExpansion: false }
    try {
      const saved = JSON.parse(localStorage.getItem('pdfbot_settings')) || defaults
      // Migrate stale model IDs
      if (saved.model === 'google/gemini-flash-1.5' || saved.model === 'google/gemini-1.5-flash') saved.model = 'google/gemini-2.5-flash'
      return saved
    } catch {
      return defaults
    }
  })

  // File filter — not persisted, resets per session
  const [filterFile, setFilterFile] = useState(null)

  useEffect(() => {
    authFetch(`${API}/status`)
      .then(r => r.json())
      .then(data => {
        if (data.indexed) setIndexed(true)
        if (data.files)   setIndexedFiles(data.files)
      })
      .catch(() => {})

    authFetch(`${API}/chat/history`)
      .then(r => r.json())
      .then(data => { if (data.messages?.length) setMessages(data.messages) })
      .catch(() => {})
  }, [])

  async function appendHistory(newMessages) {
    try {
      await authFetch(`${API}/chat/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
    } catch (_) {}
  }

  async function replaceHistory(allMessages) {
    try {
      await authFetch(`${API}/chat/history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })
    } catch (_) {}
  }

  async function clearHistory() {
    try {
      await authFetch(`${API}/chat/history`, { method: 'DELETE' })
    } catch (_) {}
  }

  function handleSettingsChange(key, value) {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem('pdfbot_settings', JSON.stringify(next))
      return next
    })
  }

  async function handleUpload(files, onProgress) {
    setUploading(true)
    try {
      const formData = new FormData()
      for (const file of files) formData.append('file', file)

      let data
      if (onProgress) {
        // XHR for progress tracking
        data = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${API}/upload`)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
          }
          xhr.onload = () => {
            try { resolve(JSON.parse(xhr.responseText)) }
            catch { reject(new Error('Invalid response')) }
          }
          xhr.onerror = () => reject(new Error('Upload failed'))
          xhr.send(formData)
        })
      } else {
        const res = await authFetch(`${API}/upload`, { method: 'POST', body: formData })
        data = await res.json()
      }

      if (data.success) {
        setIndexed(true)
        if (data.files) setIndexedFiles(data.files)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  function buildAskPayload(question, currentMessages) {
    return {
      question,
      k: settings.k,
      chainType: settings.chainType,
      model: settings.model || 'openai/gpt-4o-mini',
      filterFile: filterFile || undefined,
      queryExpansion: settings.queryExpansion || false,
      history: currentMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
    }
  }

  async function streamAsk(question, baseMessages, onToken, onDone, onError) {
    const res = await authFetch(`${API}/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAskPayload(question, baseMessages)),
    })
    if (!res.ok) throw new Error('Stream request failed')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        let event
        try {
          event = JSON.parse(line.slice(6))
        } catch {
          continue // skip malformed JSON
        }
        if (event.type === 'token') {
          onToken(event.content)
        } else if (event.type === 'done') {
          onDone(event)
          return
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }
    }
  }

  async function handleAsk(question) {
    const userMsg = { role: 'user', content: question }
    const baseMessages = messages
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', streaming: true }])
    setAsking(true)

    try {
      let finalEvent = null
      await streamAsk(
        question,
        baseMessages,
        (token) => {
          setMessages(prev => {
            const msgs = [...prev]
            const last = msgs[msgs.length - 1]
            if (last?.streaming) msgs[msgs.length - 1] = { ...last, content: last.content + token }
            return msgs
          })
        },
        (event) => { finalEvent = event },
        (err) => { throw err }
      )

      const assistantMsg = {
        role: 'assistant',
        content: finalEvent?.answer ?? '',
        sources: finalEvent?.sources ?? [],
        trace: finalEvent?.trace ?? [],
        suggestions: finalEvent?.suggestions ?? [],
      }
      setMessages(prev => {
        const msgs = [...prev]
        if (msgs[msgs.length - 1]?.streaming) msgs[msgs.length - 1] = assistantMsg
        return msgs
      })
      appendHistory([userMsg, assistantMsg])
    } catch (err) {
      console.error('Ask failed:', err)
      setMessages(prev => {
        const msgs = [...prev]
        if (msgs[msgs.length - 1]?.streaming) msgs[msgs.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
        return msgs
      })
    } finally {
      setAsking(false)
    }
  }

  async function handleRegenerate(question) {
    const idx = [...messages].reverse().findIndex(m => m.role === 'assistant')
    const withoutLastAssistant = idx === -1 ? messages : messages.slice(0, messages.length - 1 - idx)
    setMessages([...withoutLastAssistant, { role: 'assistant', content: '', streaming: true }])
    setAsking(true)

    try {
      let finalEvent = null
      await streamAsk(
        question,
        withoutLastAssistant,
        (token) => {
          setMessages(prev => {
            const msgs = [...prev]
            const last = msgs[msgs.length - 1]
            if (last?.streaming) msgs[msgs.length - 1] = { ...last, content: last.content + token }
            return msgs
          })
        },
        (event) => { finalEvent = event },
        (err) => { throw err }
      )

      const assistantMsg = {
        role: 'assistant',
        content: finalEvent?.answer ?? '',
        sources: finalEvent?.sources ?? [],
        trace: finalEvent?.trace ?? [],
        suggestions: finalEvent?.suggestions ?? [],
      }
      setMessages(prev => {
        const msgs = [...prev]
        if (msgs[msgs.length - 1]?.streaming) msgs[msgs.length - 1] = assistantMsg
        return msgs
      })
      const finalMessages = [...withoutLastAssistant, assistantMsg]
      replaceHistory(finalMessages)
    } catch (err) {
      console.error('Regenerate failed:', err)
      setMessages(prev => {
        const msgs = [...prev]
        if (msgs[msgs.length - 1]?.streaming) msgs[msgs.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' }
        return msgs
      })
    } finally {
      setAsking(false)
    }
  }

  function handleTrimMessages(upToIndex) {
    const trimmed = messages.slice(0, upToIndex)
    setMessages(trimmed)
    replaceHistory(trimmed)
  }

  function handleClearChat() {
    setMessages([])
    clearHistory()
  }

  function handleExportChat() {
    if (messages.length === 0) return
    const lines = messages.map(m => {
      if (m.role === 'user') return `## You\n${m.content}`
      return `## Assistant\n${m.content}${m.sources?.length ? '\n\n**Sources:** ' + m.sources.map(s => s.source || s.page).join(', ') : ''}`
    })
    const md = `# DocuChat AI - Conversation Export\n\n${lines.join('\n\n---\n\n')}`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleRemoveFile(filename) {
    try {
      const res = await authFetch(`${API}/index/${encodeURIComponent(filename)}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setIndexedFiles(data.files ?? [])
        if (!data.indexed) {
          setIndexed(false)
          setMessages([])
          clearHistory()
        }
      }
    } catch (err) {
      console.error('Remove file failed:', err)
    }
  }

  async function handleRemoveIndex() {
    try {
      await authFetch(`${API}/index`, { method: 'DELETE' })
    } catch (_) {}
    setIndexed(false)
    setIndexedFiles([])
    setMessages([])
    clearHistory()
  }

  return (
    <div className="app-layout">
      <div className="bg-orbs">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="orb orb-3" /><div className="orb orb-4" />
      </div>
      <div className="bg-grid" />
      {sidebarOpen && isMobile() && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="user-bar">
        <span className="user-bar-name">👤 {user.name}</span>
        <button className="user-bar-logout" onClick={logout}>Sign Out</button>
      </div>
      <Sidebar
        indexed={indexed}
        indexedFiles={indexedFiles}
        uploading={uploading}
        settings={settings}
        isOpen={sidebarOpen}
        onSettingsChange={handleSettingsChange}
        onUpload={handleUpload}
        onClearChat={handleClearChat}
        onRemoveFile={handleRemoveFile}
        onRemoveIndex={handleRemoveIndex}
        onExportChat={handleExportChat}
        onClose={() => setSidebarOpen(false)}
      />
      <Chat
        indexed={indexed}
        indexedFiles={indexedFiles}
        messages={messages}
        asking={asking}
        uploading={uploading}
        settings={settings}
        token={token}
        filterFile={filterFile}
        onFilterChange={setFilterFile}
        onAsk={handleAsk}
        onUpload={handleUpload}
        onRegenerate={handleRegenerate}
        onTrimMessages={handleTrimMessages}
        onMenuClick={() => setSidebarOpen(o => !o)}
      />
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [authPage, setAuthPage] = useState('login')

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f0f13' }}>
      <span className="spinner" style={{ width: 32, height: 32, borderTopColor: '#6366f1', borderColor: 'rgba(99,102,241,0.25)' }} />
    </div>
  )

  if (!user) {
    return authPage === 'login'
      ? <Login    onSwitch={() => setAuthPage('register')} />
      : <Register onSwitch={() => setAuthPage('login')} />
  }

  return <MainApp />
}
