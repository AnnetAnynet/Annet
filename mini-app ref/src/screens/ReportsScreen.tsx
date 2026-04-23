import { useState } from 'react'
import { IncidentDashboard } from '../components/IncidentDashboard'
import { IncidentReportSheet } from '../components/IncidentReportSheet'
import { HudButton } from '../components/HudButton'

interface ReportsScreenProps {
  telegramId: number | null
  supportUrl: string | null | undefined
}

export function ReportsScreen({ telegramId, supportUrl }: ReportsScreenProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <main className="px-5 pb-4 pt-4">
      <div className="flex items-center gap-1.5 mb-4 text-[9px] font-bold tracking-[0.12em] uppercase text-accent">
        <span className="w-3 h-px bg-accent" />
        Мониторинг сбоев
      </div>

      <p className="text-xs text-text-dim leading-relaxed mb-5">
        Если что-то не работает - сообщите нам. Данные помогают быстрее находить и устранять проблемы.
      </p>

      <IncidentDashboard />

      <div className="my-6 h-px bg-border" />

      <HudButton onClick={() => setSheetOpen(true)}>
        Сообщить о сбое
      </HudButton>

      <IncidentReportSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        telegramId={telegramId}
        supportUrl={supportUrl}
      />
    </main>
  )
}
