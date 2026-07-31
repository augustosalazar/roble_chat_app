import { useState } from 'react'
import { Plus, Users, MessageSquare, Check, X, Search, Home, LogOut } from 'lucide-react'

export default function ChatSidebar({
  systemUsers,
  onlineUserIds,
  activeChatId,
  onOpenGeneral,
  onOpenPrivateChat,
  users,
  activeUserId,
  onSwitchUser,
  onAddUser,
  onRemoveUser,
  onLogout,
  participants,
  open,
  onClose,
}) {
  const [query, setQuery] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [addingUser, setAddingUser] = useState(false)

  const isGeneral = activeChatId === 'general'

  const filteredUsers = systemUsers.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase())
  )

  const handleAddUser = () => {
    const name = newUserName.trim()
    if (!name) return
    onAddUser(name)
    setNewUserName('')
    setAddingUser(false)
  }

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
        </button>

        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <Users size={14} className="text-wa-muted" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-wa-muted">
            Mensajes directos
          </h2>
        </div>

        {filteredUsers.length === 0 ? (
          <p className="px-4 py-6 text-xs text-wa-muted text-center">
            {query ? 'Sin resultados' : 'No hay usuarios del sistema disponibles.'}
          </p>
        ) : (
          <div className="space-y-0.5">
            {filteredUsers.map((user) => {
              const isOnline = onlineUserIds.includes(String(user.userId))
              const isActive = activeChatId === dmId(user.userId)
              return (
                <div
                  key={user.userId}
                  onClick={() => { onOpenPrivateChat(user.userId); onClose && onClose() }}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                    isActive ? 'bg-wa-active' : 'hover:bg-wa-hover'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-[3px] ring-wa-sidebar ${
                        isOnline ? 'bg-wa-accent' : 'bg-wa-muted'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-wa-text truncate">{user.name}</p>
                    <p className={`text-[12px] truncate ${isOnline ? 'text-wa-accent' : 'text-wa-muted'}`}>
                      {isOnline ? 'En línea' : 'Desconectado'}
                    </p>
                  </div>
                  {isActive && <span className="w-2 h-2 rounded-full bg-wa-accent flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-3 bg-wa-panel border-t border-wa-border">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-wa-muted">
            Enviando como
          </h2>
          {addingUser ? (
            <span className="text-[11px] text-wa-accent">Nuevo usuario</span>
          ) : (
            <span className="text-[11px] text-wa-muted">{users.length}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => onSwitchUser(user.id)}
              title={user.name}
              className={`group relative flex-shrink-0 cursor-pointer rounded-full transition ${
                activeUserId === user.id
                  ? 'ring-2 ring-wa-accent ring-offset-2 ring-offset-wa-panel'
                  : 'hover:scale-105'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveUser(user.id) }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-wa-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {addingUser ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                autoFocus
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddUser() }}
                placeholder="Nombre"
                className="flex-1 min-w-0 bg-wa-bg border border-wa-border rounded-full px-3 py-1.5 text-sm text-wa-text focus:ring-1 focus:ring-wa-accent outline-none placeholder:text-wa-muted"
              />
              <button onClick={handleAddUser} className="text-wa-accent hover:text-wa-text p-1 flex-shrink-0">
                <Check size={16} />
              </button>
              <button onClick={() => setAddingUser(false)} className="text-wa-muted hover:text-wa-text p-1 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingUser(true)}
              title="Agregar usuario simulado"
              className="w-10 h-10 flex-shrink-0 rounded-full border border-dashed border-wa-muted/60 text-wa-muted hover:text-wa-accent hover:border-wa-accent flex items-center justify-center transition"
            >
              <Plus size={18} />
            </button>
          )}
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
