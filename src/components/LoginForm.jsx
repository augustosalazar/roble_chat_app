import { useState } from 'react'
import { login } from '../services/auth'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { colorFromId } from '../utils'
import { ensureDefaultUser } from '../services/users'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password })
      const { accessToken, refreshToken, user } = res.data
      const userId = user.id || user.sub
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('rol', user.rol || user.role || 'user')
      localStorage.setItem('userId', userId)
      localStorage.setItem('userName', user.name || user.email || email)
      localStorage.setItem('userColor', colorFromId(userId))
      ensureDefaultUser()
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full pl-11 pr-11 py-3 bg-wa-panel border border-wa-border rounded-xl text-wa-text focus:ring-2 focus:ring-wa-accent focus:border-wa-accent outline-none transition-shadow placeholder:text-wa-muted"
  const labelClass = "block text-sm font-medium text-wa-muted mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-wa-accent/15 border border-wa-accent/25 flex items-center justify-center mx-auto mb-4">
          <LogIn size="28" className="text-wa-accent" />
        </div>
        <h2 className="text-2xl font-bold text-wa-text">Bienvenido</h2>
        <p className="text-sm text-wa-muted mt-1">Ingresa a la demo de chat en tiempo real</p>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-xs font-bold flex-shrink-0">!</span>
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Email</label>
        <div className="relative">
          <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wa-muted" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputClass}
            placeholder="correo@ejemplo.com" required autoFocus />
        </div>
      </div>

      <div>
        <label className={labelClass}>Contraseña</label>
        <div className="relative">
          <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wa-muted" />
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••" required />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-wa-muted hover:text-wa-text">
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-wa-accent hover:bg-wa-accent-dark text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
        {loading ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Ingresando...</span>
        ) : (
          <><LogIn size={18} /> Ingresar</>
        )}
      </button>

      <p className="text-center text-sm text-wa-muted">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-wa-accent hover:text-wa-accent-dark font-medium hover:underline">Regístrate</Link>
      </p>
    </form>
  )
}
