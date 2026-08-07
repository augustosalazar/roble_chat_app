import axios from "axios";

const VITE_PROJECT_ID = import.meta.env.VITE_PROJECT_ID

export const AUTH_URL = `/auth/${VITE_PROJECT_ID}`

export function clearSession() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("rol")
  localStorage.removeItem("userId")
  localStorage.removeItem("userName")
  localStorage.removeItem("userColor")
}

let refreshPromise = null

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false

  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post(`${AUTH_URL}/refresh-token`, { refreshToken })
      localStorage.setItem("accessToken", data.accessToken)
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken)
      return true
    } catch {
      clearSession()
      window.location.href = "/"
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

const authAxios = axios.create({
  baseURL: AUTH_URL,
})

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

authAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const isAuthEndpoint =
        original.url.includes("/login") ||
        original.url.includes("/signup-direct") ||
        original.url.includes("/forgot-password") ||
        original.url.includes("/refresh-token")
      if (isAuthEndpoint) return Promise.reject(error)

      const ok = await refreshAccessToken()
      if (!ok) return Promise.reject(error)

      original.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`
      return authAxios(original)
    }
    return Promise.reject(error)
  }
)

export default authAxios
