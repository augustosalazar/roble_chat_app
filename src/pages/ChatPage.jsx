import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import ChatSidebar from '../components/ChatSidebar'
import { getMessages, pushMessage, GENERAL_CHAT_ID, dmChatId } from '../services/realtime'
import { loadUsers, ensureDefaultUser, addUser, removeUser, getActiveUserId, setActiveUserId, getSystemUsers } from '../services/users'
import { logout } from '../services/auth'
import { io } from 'socket.io-client'
import { useToast } from '../components/Toast'

const VITE_BASE_HOST = import.meta.env.VITE_BASE_HOST || 'http://localhost'
const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID

function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch { return null }
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [activeChatId, setActiveChatId] = useState(GENERAL_CHAT_ID)
  const [activeChatUser, setActiveChatUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [wsStatus, setWsStatus] = useState('disconnected')
  const [users, setUsers] = useState([])
  const [systemUsers, setSystemUsers] = useState([])
  const [onlineUserIds, setOnlineUserIds] = useState([])
  const [activeUserId, setActiveUserIdState] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const addToast = useToast()
  const socketRef = useRef(null)
  const activeChatIdRef = useRef(null)
  activeChatIdRef.current = activeChatId

  useEffect(() => {
    const initialUsers = ensureDefaultUser()
    setUsers(initialUsers)
    setActiveUserIdState(getActiveUserId() || initialUsers[0]?.id)

    let cancelled = false
    getSystemUsers()
      .then((sysUsers) => {
        if (!cancelled) setSystemUsers(sysUsers)
      })
      .catch((err) => {
        console.error('Error loading system users', err)
      })
    return () => { cancelled = true }
  }, [])

  const activeUser = useMemo(
    () => users.find(u => u.id === activeUserId) || users[0] || { name: 'Usuario', color: '#6366f1' },
    [users, activeUserId],
  )

  const participants = useMemo(() => {
    const set = new Set(messages.map(m => m.autorId).filter(Boolean))
    return set.size
  }, [messages])

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return
    try {
      const msgData = await getMessages(chatId)
      if (msgData && typeof msgData === 'object' && !Array.isArray(msgData)) {
        const msgs = Object.entries(msgData).map(([key, val]) => ({ _id: key, ...val }))
        msgs.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
        setMessages(msgs)
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Error loading messages', err)
    }
  }, [])

  useEffect(() => {
    loadMessages(activeChatId)
  }, [activeChatId, loadMessages])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token || !VITE_PROJECT_ID) return

    const jwt = decodeJwt(token)
    if (jwt) {
      if (jwt.dbName && jwt.dbName !== VITE_PROJECT_ID) {
        addToast(`dbName del JWT (${jwt.dbName}) no coincide con VITE_PROJECT_ID`, 'warning')
      }
    }

    const wsUrl = VITE_BASE_HOST.replace(/^http/, 'ws')
    const socket = io(`${wsUrl}:3003/realtime`, {
      transports: ['websocket'],
      query: { token, dbName: VITE_PROJECT_ID },
    })
    socketRef.current = socket

    let connectedBefore = false

    socket.on('connect', () => {
      setWsStatus('connected')
      if (connectedBefore) addToast('Conexión restablecida', 'success')
      connectedBefore = true
      socket.emit('subscribe', {
        type: 'subscribe',
        requestId: 'messages',
        table: 'messages',
        events: ['INSERT', 'UPDATE', 'DELETE'],
      })
    })

    socket.on('subscription_created', () => {})
    socket.on('database_change', () => {
      const current = activeChatIdRef.current
      if (current) loadMessages(current)
    })
    socket.on('presence', (data) => {
      if (Array.isArray(data?.online)) {
        setOnlineUserIds(data.online.map(String))
      }
    })
    socket.on('heartbeat', () => {})
    socket.on('disconnect', (reason) => {
      setWsStatus('disconnected')
      if (reason !== 'io client disconnect') {
        addToast(`Conexión perdida: ${reason}`, 'disconnected')
      }
    })
    socket.on('connect_error', (err) => {
      setWsStatus('error')
      console.error('[WS] Error de conexión:', err.message)
      addToast(`WebSocket: ${err.message}`, 'error')
    })

    return () => socket.disconnect()
  }, [loadMessages, addToast])

  useEffect(() => {
    if (wsStatus !== 'connected') return
    const interval = setInterval(() => {
      const current = activeChatIdRef.current
      if (current) loadMessages(current)
    }, 15000)
    return () => clearInterval(interval)
  }, [wsStatus, loadMessages])

  const sendMessage = async (texto) => {
    if (!texto.trim() || !activeChatId) return
    try {
      await pushMessage(activeChatId, texto, activeUser.name, activeUser.color, activeUser.id)
      await loadMessages(activeChatId)
    } catch (err) {
      addToast('Error al enviar mensaje', 'error')
      console.error('Error sending message', err)
    }
  }

  const openGeneral = () => {
    setActiveChatUser(null)
    setActiveChatId(GENERAL_CHAT_ID)
  }

  const openPrivateChat = (userId) => {
    const sysUser = systemUsers.find(u => String(u.userId) === String(userId))
    if (!sysUser) {
      addToast('Usuario no encontrado', 'warning')
      return
    }
    setActiveChatUser(sysUser)
    setActiveChatId(dmChatId(activeUser.id, sysUser.userId))
  }

  const handleSwitchUser = (userId) => {
    setActiveUserId(userId)
    setActiveUserIdState(userId)
    if (activeChatUser) {
      setActiveChatId(dmChatId(userId, activeChatUser.userId))
    }
  }

  const handleAddUser = (name) => {
    const user = addUser(name)
    setUsers(loadUsers())
    setActiveUserId(user.id)
    setActiveUserIdState(user.id)
    addToast(`Usuario "${user.name}" creado`, 'success')
  }

  const handleRemoveUser = (userId) => {
    if (!window.confirm('¿Eliminar este usuario simulado?')) return
    const remaining = removeUser(userId)
    setUsers(remaining)
    setActiveUserIdState(getActiveUserId() || remaining[0]?.id)
    setActiveChatUser(null)
    setActiveChatId(GENERAL_CHAT_ID)
  }

  const handleLogout = async () => {
    try { await logout() } catch {}
    localStorage.clear()
    navigate('/')
  }

  const isGeneral = activeChatId === GENERAL_CHAT_ID
  const chatTitle = isGeneral ? 'Chat general' : (activeChatUser?.name || 'Chat privado')
  const chatColor = activeChatUser?.color || activeUser.color
  const isUserOnline = onlineUserIds.includes(String(activeChatUser?.userId))
  const chatSubtitle = isGeneral
    ? (participants > 0
      ? `${participants} participante${participants !== 1 ? 's' : ''}`
      : 'Sé el primero en escribir')
    : (isUserOnline ? 'En línea' : 'Desconectado')

  return (
    <div className="relative h-screen flex bg-wa-bg text-wa-text overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ChatSidebar
        systemUsers={systemUsers}
        onlineUserIds={onlineUserIds}
        activeChatId={activeChatId}
        activeUserId={activeUserId}
        onOpenGeneral={openGeneral}
        onOpenPrivateChat={openPrivateChat}
        users={users}
        onSwitchUser={handleSwitchUser}
        onAddUser={handleAddUser}
        onRemoveUser={handleRemoveUser}
        onLogout={handleLogout}
        participants={participants}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          title={chatTitle}
          subtitle={chatSubtitle}
          color={chatColor}
          online={!isGeneral && isUserOnline}
          wsStatus={wsStatus}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        <MessageList messages={messages} currentUserId={activeUser?.id} />

        <div className="px-4 py-3 md:px-6 md:py-4 bg-wa-sidebar border-t border-wa-border">
          <MessageInput onSend={sendMessage} />
        </div>
      </main>
    </div>
  )
}
