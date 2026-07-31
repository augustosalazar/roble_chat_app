import LoginForm from '../components/LoginForm'
import { MessageSquare, Zap, Globe, Shield } from 'lucide-react'

const features = [
  { icon: Zap, text: 'Tiempo real vía WebSocket' },
  { icon: Globe, text: 'API estilo Firebase Realtime DB' },
  { icon: Shield, text: 'Autenticación JWT con Roble' },
]

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-wa-bg via-wa-sidebar to-wa-bg flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-wa-text">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-wa-accent/15 border border-wa-accent/25 flex items-center justify-center">
              <MessageSquare size={28} className="text-wa-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Chat Realtime</h1>
              <p className="text-wa-muted text-sm">Roble Platform Demo</p>
            </div>
          </div>
          <p className="text-lg text-wa-text leading-relaxed mb-8">
            Aplicación demo del servicio de base de datos en tiempo real de Roble,
            con chat general, mensajes directos, usuarios simulados y sincronización vía WebSocket.
          </p>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-wa-muted">
                <div className="bg-wa-panel p-2 rounded-lg border border-wa-border">
                  <f.icon size={18} className="text-wa-accent" />
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-wa-border">
            <p className="text-xs text-wa-muted">
              Requiere un proyecto Roble con VITE_PROJECT_ID configurado.
              Los usuarios se autentican contra el servicio de auth de Roble (puerto 3000)
              y los mensajes se almacenan en el servicio Realtime Data (puerto 3003).
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-wa-sidebar rounded-3xl shadow-2xl p-8 ring-1 ring-wa-border animate-fade-in-up">
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-wa-border">
              <div className="w-11 h-11 rounded-xl bg-wa-accent/15 flex items-center justify-center">
                <MessageSquare size={22} className="text-wa-accent" />
              </div>
              <div>
                <h2 className="font-bold text-wa-text">Chat Realtime</h2>
                <p className="text-xs text-wa-muted">Roble Platform Demo</p>
              </div>
            </div>
            <LoginForm />
          </div>
          <p className="text-center text-xs text-wa-muted mt-4 lg:hidden">
            Requiere VITE_PROJECT_ID configurado
          </p>
        </div>
      </div>
    </div>
  )
}
