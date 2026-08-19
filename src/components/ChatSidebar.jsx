import { useState } from 'react'
import { Users, MessageSquare, X, Search, Home, LogOut } from 'lucide-react'

function formatListTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }
  const yest = new Date(now)
  yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export default function ChatSidebar({
  systemUsers,
  activeChatId,
  activeUserId,
  onOpenGeneral,
  onOpenPrivateChat,
  onLogout,
  participants,
  unreadMap,
  lastMsgMap,
  activeUser,
  open,
  onClose,
}) {
  const [query, setQuery] = useState('')

  const isGeneral = activeChatId === 'general'
  const generalUnread = unreadMap?.['general'] || 0

  const filteredUsers = systemUsers.filter(u =>
    String(u.userId) !== String(activeUser?.id) &&
    u.name.toLowerCase().includes(query.toLowerCase())
  )

  const dmId = (otherId) => `dm_${[activeUserId, otherId].sort().join('_')}`

  return (
    <aside className={`${open ? 'flex' : 'hidden lg:flex'} absolute lg:static inset-y-0 left-0 z-30 w-80 lg:w-96 flex-shrink-0 flex-col bg-wa-sidebar border-r border-wa-border min-h-0`}>
      <div className="px-4 py-3.5 bg-wa-panel border-b border-wa-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-wa-accent/15 border border-wa-accent/25 flex items-center justify-center flex-shrink-0">
            <MessageSquare size={20} className="text-wa-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight text-wa-text">Roble Chat</h1>
            <p className="text-[11px] text-wa-muted truncate">Chat general y privado · Roble</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-wa-muted hover:text-wa-text p-1">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-wa-bg rounded-full px-4 py-2.5 focus-within:ring-1 focus-within:ring-wa-accent transition">
          <Search size={16} className="text-wa-muted flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar conversación..."
            className="flex-1 bg-transparent text-sm text-wa-text outline-none placeholder:text-wa-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto wa-scrollbar px-3 pb-3 min-h-0">
        <button
          onClick={() => { onOpenGeneral(); onClose && onClose() }}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition mb-1 ${
            isGeneral ? 'bg-wa-active' : 'hover:bg-wa-hover'
          }`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-wa-accent/20 text-wa-accent">
              <Home size={20} />
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[15px] font-medium text-wa-text truncate">Chat general</p>
            <p className="text-[12px] text-wa-muted truncate">
              {participants > 0
                ? `${participants} participante${participants !== 1 ? 's' : ''}`
                : 'Todos los usuarios'}
            </p>
          </div>
          {generalUnread > 0 && (
            <span className="bg-wa-accent text-white text-[11px] font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
              {generalUnread}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <Users size={14} className="text-wa-muted" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-muted">
            Mensajes directos
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="px-4 py-6 text-xs text-wa-muted text-center">
            {query ? 'Sin resultados' : 'No hay otros usuarios disponibles.'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredUsers.map((user) => {
              const chatId = dmId(user.userId)
              const isActive = activeChatId === chatId
              const last = lastMsgMap?.[chatId]
              const unread = unreadMap?.[chatId] || 0
              const isLastMine = last && String(last.autorId) === String(activeUser?.id)
              const subtitle = last
                ? `${isLastMine ? 'Tú: ' : ''}${last.texto || ''}`
                : ''
              return (
                <div
                  key={user.userId}
                  onClick={() => { onOpenPrivateChat(user.userId); onClose && onClose() }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                    isActive ? 'bg-wa-active' : 'hover:bg-wa-hover'
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow flex-shrink-0"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-wa-text truncate">{user.name}</p>
                    <p className="text-[12px] text-wa-muted truncate">{subtitle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {last && <span className="text-[11px] text-wa-muted">{formatListTime(last.timestamp)}</span>}
                    {unread > 0 && (
                      <span className="bg-wa-accent text-white text-[11px] font-semibold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-3 bg-wa-panel border-t border-wa-border">
        <div className="flex items-center gap-3 px-2 pb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow flex-shrink-0"
            style={{ backgroundColor: activeUser?.color }}
          >
            {(activeUser?.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-wa-text truncate">
              {activeUser?.name || 'Usuario'}
            </p>
            <p className="text-[11px] text-wa-muted">Sesión activa</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-xs text-wa-muted hover:text-wa-text border border-wa-border hover:border-wa-muted/60 rounded-full px-3 py-2 transition"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
