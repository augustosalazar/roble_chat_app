import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import {
  exchangeGoogleLogin,
  exchangeMicrosoftLogin,
  clearSession,
  saveSession,
} from '../services/api'

export default function SsoDone() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(search)
  const code = params.get('code')
  const provider = params.get('provider')

  const ranRef = useRef(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ranRef.current) return
    if (!code) {
      setError('No se recibió el código de inicio de sesión.')
      return
    }
    ranRef.current = true
    clearSession()

    const exchange =
      provider === 'microsoft'
        ? exchangeMicrosoftLogin(code)
        : exchangeGoogleLogin(code)

    exchange
      .then((data) => {
        saveSession(data)
        navigate('/chat', { replace: true })
      })
      .catch(() => setError('No se pudo completar el inicio de sesión.'))
  }, [code, provider, navigate])

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-wa-bg via-wa-sidebar to-wa-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-wa-sidebar rounded-3xl shadow-2xl p-8 ring-1 ring-wa-border text-center animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-wa-accent/15 border border-wa-accent/25 flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={28} className="text-wa-accent" />
        </div>
        {error ? (
          <div>
            <h2 className="text-lg font-bold text-wa-danger mb-2">Algo salió mal</h2>
            <p className="text-sm text-wa-muted">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="mt-5 w-full bg-wa-accent hover:bg-wa-accent-dark text-white font-semibold py-2.5 rounded-xl transition-all"
            >
              Volver al inicio
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-wa-text mb-2">Conectando…</h2>
            <p className="text-sm text-wa-muted">Completando tu inicio de sesión</p>
            <div className="mx-auto mt-5 w-8 h-8 border-2 border-wa-accent/30 border-t-wa-accent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}