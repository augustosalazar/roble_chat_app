import authAxios from './api'

export const login = (credentials) => authAxios.post('/login', credentials)

export const register = (userData) => authAxios.post('/signup-direct', userData)

export const logout = () => authAxios.post('/logout')

export const getProfile = () => authAxios.get('/profile')

export const deleteAccount = () => authAxios.delete('/account')

export const refreshToken = () => {
  const refreshToken = localStorage.getItem("refreshToken")
  return authAxios.post('/refresh-token', { refreshToken })
}
