import { colorFromId } from '../utils'

const STORAGE_KEY = 'chatUsers'
const ACTIVE_KEY = 'chatActiveUserId'

const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID
const VITE_DB_SERVICE_HOST = import.meta.env.VITE_DB_SERVICE_HOST || 'http://localhost:3002'
const VITE_ID_CONSULTA_LISTA_USUARIOS = import.meta.env.VITE_ID_CONSULTA_LISTA_USUARIOS

export async function getSystemUsers() {
  if (!VITE_ID_CONSULTA_LISTA_USUARIOS) {
    console.warn('[users] VITE_ID_CONSULTA_LISTA_USUARIOS no configurado')
    return []
  }

  const token = localStorage.getItem('accessToken')
  let res = await fetch(`${VITE_DB_SERVICE_HOST}/${VITE_PROJECT_ID}/execute-query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: VITE_ID_CONSULTA_LISTA_USUARIOS, params: [] }),
  })

  if (res.status === 401) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) throw new Error('Sesión expirada')
    res = await fetch(`${VITE_DB_SERVICE_HOST}/${VITE_PROJECT_ID}/execute-query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: VITE_ID_CONSULTA_LISTA_USUARIOS, params: [] }),
    })
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Error al obtener usuarios: ${res.status} ${text}`)
  }

  const data = await res.json()
  const rows = Array.isArray(data?.rows) ? data.rows : []

  return rows.map((row) => {
    const id = row.user_id || row.userId || row.id
    const name = row.name || row.email || 'Usuario'
    return {
      id: String(id),
      userId: String(id),
      name,
      email: row.email || '',
      color: row.color || colorFromId(String(id)),
      online: !!row.online,
      extra: row.extra ?? null,
    }
  })
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false
  try {
    const VITE_BASE_HOST = import.meta.env.VITE_BASE_HOST || 'http://localhost'
    const res = await fetch(`${VITE_BASE_HOST}:3000/${VITE_PROJECT_ID}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('accessToken', data.accessToken)
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
    return true
  } catch {
    return false
  }
}


export function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const users = raw ? JSON.parse(raw) : []
    return Array.isArray(users) ? users : []
  } catch {
    return []
  }
}

export function ensureDefaultUser() {
  const users = loadUsers()
  if (users.length > 0) return users

  const userId = localStorage.getItem('userId') || `user_${Date.now()}`
  const defaultUser = {
    id: userId,
    name: localStorage.getItem('userName') || 'Usuario',
    color: localStorage.getItem('userColor') || colorFromId(userId),
  }

  saveUsers([defaultUser])
  setActiveUserId(userId)
  return [defaultUser]
}

export function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function addUser(name, color) {
  const users = loadUsers()
  const user = {
    id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: name || `Usuario ${users.length + 1}`,
    color: color || colorFromId(`sim_${Date.now()}`),
  }
  users.push(user)
  saveUsers(users)
  return user
}

export function removeUser(userId) {
  let users = loadUsers()
  users = users.filter(u => u.id !== userId)
  if (users.length === 0) {
    const userIdNew = localStorage.getItem('userId') || `user_${Date.now()}`
    users = [{
      id: userIdNew,
      name: localStorage.getItem('userName') || 'Usuario',
      color: localStorage.getItem('userColor') || colorFromId(userIdNew),
    }]
  }
  saveUsers(users)
  const active = getActiveUserId()
  if (active === userId || !users.some(u => u.id === active)) {
    setActiveUserId(users[0].id)
  }
  return users
}

export function getActiveUserId() {
  return localStorage.getItem(ACTIVE_KEY)
}

export function setActiveUserId(userId) {
  localStorage.setItem(ACTIVE_KEY, userId)
}

export function getActiveUser() {
  const users = loadUsers()
  const activeId = getActiveUserId()
  return users.find(u => u.id === activeId) || users[0] || null
}
