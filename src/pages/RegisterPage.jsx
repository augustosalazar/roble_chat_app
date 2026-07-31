import RegisterForm from '../components/RegisterForm'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b141a] via-[#111b21] to-black flex">
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-wa-accent/15 border border-wa-accent/25 flex items-center justify-center">
              <UserPlus size={28} className="text-wa-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Crear Cuenta</h1>
              <p className="text-wa-muted text-sm">Regístrate para probar la demo</p>
            </div>
          </div>
          <p className="text-lg text-zinc-300 leading-relaxed mb-8">
            Crea una cuenta en el proyecto Roble para poder acceder al chat.
            Una vez registrado, podrás escribir en el chat general, abrir mensajes
            directos con otros usuarios y probar la mensajería en tiempo real.
          </p>
          <div className="bg-wa-panel/60 border border-wa-border rounded-2xl p-6">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-wa-muted">Flujo de la demo</h3>
            <ol className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="bg-wa-active w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-wa-accent">1</span>
                <span>Regístrate o inicia sesión en tu proyecto Roble</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-wa-active w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-wa-accent">2</span>
                <span>Usa el chat general o abre un mensaje directo con cualquier usuario</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-wa-active w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-wa-accent">3</span>
                <span>Crea usuarios simulados y cambia entre ellos desde la barra lateral</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-wa-active w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-wa-accent">4</span>
                <span>Los mensajes se sincronizan vía WebSocket con todos los clientes</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-wa-sidebar rounded-3xl shadow-2xl p-8 ring-1 ring-wa-border">
            <div className="lg:hidden flex items-center gap-3 mb-6 pb-6 border-b border-wa-border">
              <div className="w-11 h-11 rounded-xl bg-wa-accent/15 flex items-center justify-center">
                <UserPlus size={22} className="text-wa-accent" />
              </div>
              <div>
                <h2 className="font-bold text-wa-text">Crear Cuenta</h2>
                <p className="text-xs text-wa-muted">Roble Platform Demo</p>
              </div>
            </div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  )
}
