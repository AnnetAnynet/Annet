import type { MtProtoServerPublic } from '../api/types'

interface ProxyConnectSheetProps {
  open: boolean
  onClose: () => void
  servers: MtProtoServerPublic[]
  onConnectProxy: (proxyLink: string) => void
}

export function ProxyConnectSheet({ open, onClose, servers, onConnectProxy }: ProxyConnectSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ animation: 'fade-in 0.2s ease' }}
        onClick={onClose}
      />

      <div
        className="absolute bottom-0 left-0 right-0 bg-[#0f1923] rounded-t-2xl max-h-[80vh] overflow-y-auto"
        style={{ animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="pt-3 pb-2 px-5">
          <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.12em] uppercase text-[#4a7fcc]">
              <span className="w-3 h-px bg-[#4a7fcc]" />
              Подключение к MTProto
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#6b85a8] text-sm cursor-pointer hover:border-[#4a7fcc] transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 pb-10 space-y-3">
          {servers.length === 0 ? (
            <div className="text-sm text-[#6b85a8] text-center py-8">
              Прокси временно недоступны. Следите за обновлениями в канале.
            </div>
          ) : (
            servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                onConnect={() => onConnectProxy(server.proxy_link)}
              />
            ))
          )}

          {servers.length > 0 && (
            <p className="text-[11px] text-[#6b85a8] text-center pt-2">
              Подключение открывается внутри Telegram (без браузера). После подтверждения Mini App
              закроется - снова откройте его из чата с ботом.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ServerCard({ server, onConnect }: { server: MtProtoServerPublic; onConnect: () => void }) {
  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(74,127,204,0.15)] flex items-center justify-center text-[#4a7fcc]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">{server.name}</span>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="px-4 py-2 rounded-lg text-xs font-bold text-white cursor-pointer active:opacity-80 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, #3a6fc4 0%, #4a8fd4 100%)',
        }}
      >
        Подключить
      </button>
    </div>
  )
}
