import ExecutionTrace from './ExecutionTrace'
import SourceChunks from './SourceChunks'

export default function MessageBubble({ message, onSuggestionClick }) {
  return (
    <div className={`bubble ${message.role}`}>
      {message.question && (
        <p className="multi-q-label">Q: {message.question}</p>
      )}
      <div className="bubble-content">
        {message.content}
        {message.streaming && <span className="stream-cursor" />}
      </div>
      {message.suggestions?.length > 0 && onSuggestionClick && (
        <div className="suggestion-section">
          <div className="suggestion-header">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1v6H2l6 8V9h6L8 1z" fill="currentColor"/>
            </svg>
            <span className="suggestion-label">Follow-up questions</span>
          </div>
          <div className="suggestion-chips">
            {message.suggestions.map((s, i) => (
              <button key={i} className="suggestion-chip" onClick={() => onSuggestionClick(s)}>
                <svg className="chip-arrow" width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {message.trace?.length > 0 && <ExecutionTrace trace={message.trace} />}
      {message.sources?.length > 0 && <SourceChunks sources={message.sources} />}
    </div>
  )
}
