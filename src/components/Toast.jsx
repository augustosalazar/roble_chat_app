import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react'

const ToastContext = createContext()

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
  connected: Wifi,
  disconnected: WifiOff,
}

const COLORS = {
  success: 'bg-zinc-900 border-zinc-700 text-white',
  error: 'bg-zinc-900 border-red-500 text-red-300',
  info: 'bg-zinc-900 border-zinc-700 text-zinc-200',
  warning: 'bg-zinc-900 border-amber-500 text-amber-300',
  connected: 'bg-zinc-900 border-emerald-500 text-emerald-300',
  disconnected: 'bg-zinc-900 border-red-500 text-red-300',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(t => {
          const Icon = ICONS[t.type] || Info
          const color = COLORS[t.type] || COLORS.info
          return (
            <div key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in ${color}`}>
              <Icon size={20} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{t.message}</p>
              <button onClick={() => removeToast(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
