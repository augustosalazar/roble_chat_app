import { useState, useEffect } from 'react'
import { login, getGoogleConfig } from '../services/auth'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { saveSession, getGoogleLoginUrl } from '../services/api'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    getGoogleConfig()
      .then((res) => {
        const cfg = res.data
        if (!cancelled && cfg?.enabled && cfg.clientId) setGoogleEnabled(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleGoogle = () => {
    window.location.href = getGoogleLoginUrl()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password })
      saveSession({ ...res.data, email })
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
        <div className="bg-wa-danger/10 border border-wa-danger/30 text-wa-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-wa-danger/20 flex items-center justify-center text-xs font-bold flex-shrink-0">!</span>
          {error}
        </div>
      )}

      {googleEnabled && (
        <>
          <button type="button" onClick={handleGoogle}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-wa-border shadow-sm">
            <GoogleIcon />
            Continuar con Google
          </button>
          <div className="flex items-center gap-3 my-1">
            <span className="flex-1 h-px bg-wa-border" />
            <span className="text-xs text-wa-muted">o</span>
            <span className="flex-1 h-px bg-wa-border" />
          </div>
        </>
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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C43.3 36.2 44 30.8 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  )
}
