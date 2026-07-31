import { Menu, WifiOff } from 'lucide-react'

export default function Header({
  title,
  subtitle,
  color,
  online,
  wsStatus,
  onToggleSidebar,
}) {
  return (
    <header className="flex items-center gap-3 px-4 md:px-6 py-3 bg-wa-panel border-b border-wa-border">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden text-wa-muted hover:text-wa-text p-1 -ml-1"
        title="Mostrar conversaciones"
      >
        <Menu size={22} />
      </button>

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {title.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-wa-text truncate">{title}</h1>
        <p className={`text-xs truncate ${online ? 'text-wa-online' : 'text-wa-muted'}`}>
          {subtitle}
        </p>
      </div>

      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border flex-shrink-0 ${
          wsStatus === 'connected'
            ? 'text-wa-online border-wa-online/30 bg-wa-online/10'
            : 'text-wa-danger border-wa-danger/30 bg-wa-danger/10'
        }`}
      >
        {wsStatus === 'connected' ? (
          <span className="w-1.5 h-1.5 rounded-full bg-wa-online animate-pulse-dot" />
        ) : (
          <WifiOff size={13} />
        )}
        <span className="hidden sm:inline">
          {wsStatus === 'connected' ? 'En vivo' : 'Desconectado'}
        </span>
      </div>
    </header>
  )
}
