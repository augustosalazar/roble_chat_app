import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import ChatSidebar from '../components/ChatSidebar'
import { getMessages, pushMessage, updateMessage, GENERAL_CHAT_ID, dmChatId } from '../services/realtime'
import { getSystemUsers, getCurrentUser } from '../services/users'
import { getLastRead, setLastRead, getUnread, setUnreadCount, getLastMessages, setLastMessage } from '../services/chatState'
import { logout } from '../services/auth'
import { io } from 'socket.io-client'
import { useToast } from '../components/Toast'

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
  const [systemUsers, setSystemUsers] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadMap, setUnreadMap] = useState({})
  const [lastMsgMap, setLastMsgMap] = useState({})
  const addToast = useToast()
  const socketRef = useRef(null)

  const activeUser = useMemo(() => getCurrentUser(), [])
  const activeChatIdRef = useRef(null)
  activeChatIdRef.current = activeChatId
  const activeUserIdRef = useRef(null)
  activeUserIdRef.current = activeUser.id
  const activeUserRef = useRef(null)
  activeUserRef.current = activeUser
  const systemUsersRef = useRef([])

  const isDM = useCallback((chatId) => String(chatId).startsWith('dm_'), [])

  const syncChatState = useCallback(() => {
    const me = activeUserIdRef.current
    if (!me) return
    setUnreadMap(getUnread(me))
    setLastMsgMap(getLastMessages(me))
  }, [])

  const applyChatState = useCallback((chatId, msgs) => {
    const me = activeUserIdRef.current
    if (!me) return
    const lastRead = getLastRead(me)[chatId]
    const unread = msgs.filter(m =>
      String(m.autorId) !== String(me) &&
      (!lastRead || new Date(m.timestamp || 0) > new Date(lastRead))
    ).length
    setUnreadCount(me, chatId, unread)
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null
    if (last) {
      setLastMessage(me, chatId, {
        chatId,
        texto: last.texto,
        autor: last.autor,
        autorId: last.autorId,
        color: last.color,
        timestamp: last.timestamp,
      })
    }
    syncChatState()
  }, [syncChatState])

  const markMessagesRead = useCallback(async (chatId, msgs) => {
    if (!isDM(chatId)) return
    const me = activeUserIdRef.current
    if (!me) return
    const targets = msgs.filter(m =>
      m?._id &&
      String(m.autorId) !== String(me) &&
      (m.status === 'sent' || m.status === 'received')
    )
    if (targets.length > 0) {
      setLastRead(me, chatId, new Date().toISOString())
    }
    for (const m of targets) {
      try {
        await updateMessage(chatId, m._id, { status: 'read' })
      } catch (err) {
        console.error('Error marking message read', err)
      }
    }
  }, [isDM])

  const applyInsert = useCallback((chatId, msgId, msg) => {
    const me = activeUserIdRef.current
    if (!me || !msg || typeof msg !== 'object') return
    setLastMessage(me, chatId, {
      chatId,
      texto: msg.texto,
      autor: msg.autor,
      autorId: msg.autorId,
      color: msg.color,
      timestamp: msg.timestamp,
    })
    if (chatId === activeChatIdRef.current) {
      setLastRead(me, chatId, new Date().toISOString())
      setMessages(prev => {
        if (prev.some(m => m._id === msgId)) return prev
        return [...prev, { _id: msgId, ...msg }]
          .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
      })
    } else {
      const fromOther = msg.autorId && String(msg.autorId) !== String(me)
      const lastRead = getLastRead(me)[chatId]
      const isNew = fromOther && (!lastRead || new Date(msg.timestamp || 0) > new Date(lastRead))
      if (isNew) {
        setUnreadCount(me, chatId, (getUnread(me)[chatId] || 0) + 1)
      }
    }
    syncChatState()
  }, [syncChatState])

  const applyUpdate = useCallback((chatId, msgId, patch) => {
    if (!patch || typeof patch !== 'object') return
    if (chatId !== activeChatIdRef.current) return
    setMessages(prev => prev.map(m => m._id === msgId ? { ...m, ...patch } : m))
  }, [])

  const applyDelete = useCallback((chatId, msgId) => {
    if (chatId !== activeChatIdRef.current) return
    setMessages(prev => prev.filter(m => m._id !== msgId))
  }, [])

  const scanChat = useCallback(async (chatId) => {
    if (!chatId) return
    try {
      const msgData = await getMessages(chatId)
      let msgs = []
      if (msgData && typeof msgData === 'object' && !Array.isArray(msgData)) {
        msgs = Object.entries(msgData).map(([key, val]) => ({ _id: key, ...val }))
        msgs.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
      }
      if (chatId === activeChatIdRef.current) {
        setMessages(msgs)
        markMessagesRead(chatId, msgs)
      }
      applyChatState(chatId, msgs)
    } catch (err) {
      console.error(`Error scanning chat ${chatId}`, err)
    }
  }, [applyChatState, markMessagesRead])

  const scanAllChats = useCallback(async () => {
    const me = activeUserIdRef.current
    if (!me) return
    const chatIds = [
      GENERAL_CHAT_ID,
      ...systemUsersRef.current.map(u => dmChatId(me, u.userId)),
    ]
    await Promise.all(chatIds.map(chatId => scanChat(chatId)))
  }, [scanChat])

  useEffect(() => {
    let cancelled = false
    getSystemUsers()
      .then((sysUsers) => {
        if (cancelled) return
        setSystemUsers(sysUsers)
        systemUsersRef.current = sysUsers
        scanAllChats()
      })
      .catch((err) => {
        console.error('Error loading system users', err)
      })
    return () => { cancelled = true }
  }, [scanAllChats])

  useEffect(() => {
    if (!activeUser.id) return
    syncChatState()
  }, [activeUser.id, syncChatState])

  useEffect(() => {
    if (!activeUser.id || !activeChatId) return
    setLastRead(activeUser.id, activeChatId, new Date().toISOString())
    scanChat(activeChatId)
  }, [activeChatId, activeUser.id, scanChat])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token || !VITE_PROJECT_ID) return

    const jwt = decodeJwt(token)
    if (jwt) {
      if (jwt.dbName && jwt.dbName !== VITE_PROJECT_ID) {
        addToast(`dbName del JWT (${jwt.dbName}) no coincide con VITE_PROJECT_ID`, 'warning')
      }
    }

    const socket = io(`${window.location.origin}/realtime`, {
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
    socket.on('database_change', (payload) => {
      const events = Array.isArray(payload) ? payload : [payload]
      const me = activeUserIdRef.current
      for (const ev of events) {
        const chatId = ev?.path?.[1]
        if (!chatId) {
          scanAllChats()
          continue
        }
        if (ev.operation === 'INSERT' && ev.new && typeof ev.new === 'object') {
          for (const [msgId, msg] of Object.entries(ev.new)) {
            applyInsert(chatId, msgId, msg)
            if (me && msgId && msg && typeof msg === 'object' && msg.autorId &&
                String(msg.autorId) !== String(me) && isDM(chatId)) {
              updateMessage(chatId, msgId, {
                status: chatId === activeChatIdRef.current ? 'read' : 'received',
              }).catch(() => {})
            }
          }
        } else if (ev.operation === 'UPDATE') {
          const msgId = ev?.path?.[2]
          if (msgId) applyUpdate(chatId, msgId, ev.new)
          else scanChat(chatId)
        } else if (ev.operation === 'DELETE') {
          const msgId = ev?.path?.[2]
          if (msgId) applyDelete(chatId, msgId)
          else scanChat(chatId)
        } else {
          scanChat(chatId)
        }
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
  }, [scanChat, scanAllChats, isDM, addToast])

  useEffect(() => {
    if (wsStatus !== 'connected') return
    const interval = setInterval(() => scanAllChats(), 15000)
    return () => clearInterval(interval)
  }, [wsStatus, scanAllChats])

  const participants = useMemo(() => {
    const set = new Set(messages.map(m => m.autorId).filter(Boolean))
    return set.size
  }, [messages])

  const sendMessage = async (texto) => {
    if (!texto.trim() || !activeChatId) return
    try {
      const res = await pushMessage(activeChatId, texto, activeUser.name, activeUser.color, activeUser.id)
      const msgId = res?.name
      if (msgId) {
        applyInsert(activeChatId, msgId, {
          texto,
          autor: activeUser.name,
          color: activeUser.color,
          autorId: activeUser.id,
          timestamp: new Date().toISOString(),
          status: 'sent',
        })
      }
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

  const handleLogout = async () => {
    try { await logout() } catch {}
    localStorage.clear()
    navigate('/')
  }

  const isGeneral = activeChatId === GENERAL_CHAT_ID
  const chatTitle = isGeneral ? 'Chat general' : (activeChatUser?.name || 'Chat privado')
  const chatColor = activeChatUser?.color || activeUser.color
  const chatSubtitle = isGeneral
    ? (participants > 0
      ? `${participants} participante${participants !== 1 ? 's' : ''}`
      : 'Sé el primero en escribir')
    : 'Mensaje directo'

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
        activeChatId={activeChatId}
        activeUserId={activeUser.id}
        onOpenGeneral={openGeneral}
        onOpenPrivateChat={openPrivateChat}
        onLogout={handleLogout}
        participants={participants}
        unreadMap={unreadMap}
        lastMsgMap={lastMsgMap}
        activeUser={activeUser}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          title={chatTitle}
          subtitle={chatSubtitle}
          color={chatColor}
          wsStatus={wsStatus}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        <MessageList messages={messages} currentUserId={activeUser.id} />

        <div className="px-4 py-3 md:px-6 md:py-4 bg-wa-sidebar border-t border-wa-border">
          <MessageInput onSend={sendMessage} />
        </div>
      </main>
    </div>
  )
}
