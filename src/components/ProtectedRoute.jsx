import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('accessToken')
  const rol = localStorage.getItem('rol')

  if (!token) return <Navigate to="/" replace />

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(rol)) return <Navigate to="/" replace />
  }

  return children
}
