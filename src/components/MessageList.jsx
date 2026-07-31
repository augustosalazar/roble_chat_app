import { useEffect, useRef, useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { colorFromId } from '../utils'

function sameDay(a, b) {
  return a && b && new Date(a).toDateString() === new Date(b).toDateString()
}

function formatDayLabel(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Hoy'
  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatClock(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const grouped = useMemo(() => {
    const groups = []
    messages.forEach((msg, i) => {
      const prev = messages[i - 1]
      const newDay = !sameDay(prev?.timestamp, msg.timestamp)
      const newAuthor = !prev || prev.autorId !== msg.autorId || newDay
      if (newAuthor) {
        groups.push({ type: 'group', messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })
    return groups
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 chat-wallpaper flex items-center justify-center min-h-0">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-wa-accent/10 border border-wa-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-wa-accent" />
          </div>
          <h3 className="text-lg font-semibold text-wa-text mb-1">Sin mensajes aún</h3>
          <p className="text-sm text-wa-muted max-w-xs">Sé el primero en escribir un mensaje</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 chat-wallpaper p-4 md:p-6 overflow-y-auto wa-scrollbar min-h-0"
    >
      {grouped.map((group, gi) => {
        const first = group.messages[0]
        const last = group.messages[group.messages.length - 1]
        const isMe = currentUserId === first.autorId
        const color = first.color || colorFromId(first.autorId)
        const name = first.autor || 'Desconocido'
        const showDay = gi === 0 || !sameDay(grouped[gi - 1].messages[0].timestamp, first.timestamp)

        return (
          <div key={gi} className="animate-fade-in-up">
            {showDay && (
              <div className="flex justify-center my-4">
                <span className="text-[11px] text-wa-muted bg-wa-panel px-3 py-1 rounded-full border border-wa-border shadow">
                  {formatDayLabel(first.timestamp)}
                </span>
              </div>
            )}

            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
              {group.messages.map((msg, mi) => {
                const isFirst = mi === 0
                return (
                  <div
                    key={msg._id || mi}
                    className={`flex items-end gap-2 max-w-[85%] md:max-w-[65%] ${
                      isMe ? 'flex-row-reverse' : ''
                    } ${isFirst ? 'mt-1' : 'mt-0.5'}`}
                  >
                    {!isMe && (
                      isFirst ? (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow"
                          style={{ backgroundColor: color }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0" />
                      )
                    )}
                    <div className="min-w-0">
                      {!isMe && isFirst && (
                        <p className="text-[11px] font-medium mb-0.5 px-1" style={{ color }}>
                          {name}
                        </p>
                      )}
                      <div
                        className={`px-3.5 py-2 text-sm leading-relaxed shadow-sm transition-colors ${
                          isMe
                            ? 'bg-wa-bubble hover:bg-wa-bubble-hover text-white rounded-lg rounded-br-sm'
                            : 'bg-wa-panel text-wa-text rounded-lg rounded-bl-sm'
                        } ${mi !== group.messages.length - 1 ? 'mb-0.5' : ''}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.texto}</p>
                        <span className={`block text-right text-[10px] leading-none mt-1 ${
                          isMe ? 'text-white/60' : 'text-wa-muted'
                        }`}>
                          {formatClock(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
