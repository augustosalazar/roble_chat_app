const VITE_BASE_HOST = import.meta.env.VITE_BASE_HOST || 'http://localhost'
const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID

const REALTIME_REST = `${VITE_BASE_HOST}:3003/realtime/data/${VITE_PROJECT_ID}`

export const GENERAL_CHAT_ID = 'general'

export function dmChatId(a, b) {
  return 'dm_' + [String(a), String(b)].sort().join('_')
}

async function api(method, path, body) {
  const token = localStorage.getItem("accessToken")
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${REALTIME_REST}${path}`, opts)
  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      opts.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`
      const retry = await fetch(`${REALTIME_REST}${path}`, opts)
      if (!retry.ok) throw new Error(`Realtime API error ${retry.status}: ${await retry.text()}`)
      const retryText = await retry.text()
      return retryText ? JSON.parse(retryText) : null
    }
    throw new Error('Sesión expirada')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Realtime API error ${res.status}: ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false
  try {
    const res = await fetch(`${VITE_BASE_HOST}:3000/${VITE_PROJECT_ID}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem("accessToken", data.accessToken)
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken)
    return true
  } catch {
    return false
  }
}

export function getChats() {
  return api('GET', '/chats')
}

export function createChat(name, color) {
  return api('POST', '/chats', {
    name,
    color: color || '#10b981',
    createdAt: new Date().toISOString(),
    createdBy: localStorage.getItem('userId') || 'unknown',
  })
}

export function deleteChat(chatId) {
  return api('DELETE', `/chats/${chatId}`)
}

export function getMessages(chatId) {
  return api('GET', `/messages/${chatId}`)
}

export function pushMessage(chatId, texto, autor, color, autorId) {
  return api('POST', `/messages/${chatId}`, {
    texto,
    autor,
    color,
    autorId,
    timestamp: new Date().toISOString(),
  })
}

export function clearMessages(chatId) {
  return api('PUT', `/messages/${chatId}`, {})
}
