import { colorFromId } from '../utils'

const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID
const VITE_ID_CONSULTA_LISTA_USUARIOS = import.meta.env.VITE_ID_CONSULTA_LISTA_USUARIOS

const DB_URL = `/database/${VITE_PROJECT_ID}`

export async function getSystemUsers() {
  if (!VITE_ID_CONSULTA_LISTA_USUARIOS) {
    console.warn('[users] VITE_ID_CONSULTA_LISTA_USUARIOS no configurado')
    return []
  }

  const token = localStorage.getItem('accessToken')
  let res = await fetch(`${DB_URL}/execute-query`, {
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
    res = await fetch(`${DB_URL}/execute-query`, {
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
      extra: row.extra ?? null,
    }
  })
}

export function getCurrentUser() {
  const id = localStorage.getItem('userId') || `user_${Date.now()}`
  return {
    id,
    name: localStorage.getItem('userName') || 'Usuario',
    color: localStorage.getItem('userColor') || colorFromId(id),
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return false
  try {
    const res = await fetch(`/auth/${VITE_PROJECT_ID}/refresh-token`, {
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
