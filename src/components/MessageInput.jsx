import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    }
  }, [text])

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="w-full px-5 py-3.5 bg-wa-panel border border-wa-border rounded-2xl focus:ring-2 focus:ring-wa-accent focus:border-wa-accent outline-none resize-none text-sm text-wa-text transition-shadow placeholder:text-wa-muted"
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!text.trim()}
        title="Enviar"
        className="bg-wa-accent hover:bg-wa-accent-dark disabled:bg-wa-active disabled:cursor-not-allowed text-white w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow hover:shadow-lg hover:-translate-y-0.5 disabled:shadow-none disabled:hover:translate-y-0 active:scale-95"
      >
        <Send size={18} />
      </button>
    </div>
  )
}
