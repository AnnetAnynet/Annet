import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { GameEngine } from './engine/GameEngine'
import type { GameStateSnapshot, OvertakeEvent } from './engine/types'
import {
  fetchGameProfile,
  fetchGameRivals,
  fetchMyStats,
  patchGameActiveSkin,
  submitGameScore,
} from '../api/endpoints'
import type { GameProfile } from '../api/types'
import { GameHUD } from './components/GameHUD'
import { BiomeIntroOverlay } from './components/BiomeIntroOverlay'
import { StartScreen } from './components/StartScreen'
import { GameOverScreen } from './components/GameOverScreen'
import { RivalTracker } from './components/RivalTracker'
import { OvertakeOverlay } from './components/OvertakeOverlay'
import { SkinSelectSheet } from './components/SkinSelectSheet'
import { DEFAULT_SKIN_KEY } from './engine/constants'
import { fromRosterEntry, type Rival } from './rivals'
import { getDailyBiomeOrder, todayMskIso } from './dailySeed'

interface GameScreenProps {
  onClose: () => void
  telegramId: number | null
  defaultNickname: string
  /** Backend admin: can enable optional no-damage preview (see StartScreen / HUD) */
  isAdmin?: boolean
}

function getNicknameKey(telegramId: number | null): string {
  return telegramId ? `game_nickname_${telegramId}` : 'game_nickname'
}

function getAdminPreviewKey(telegramId: number | null): string {
  return telegramId ? `game_admin_preview_${telegramId}` : 'game_admin_preview'
}

function readAdminPreviewNoDamage(telegramId: number | null): boolean {
  return localStorage.getItem(getAdminPreviewKey(telegramId)) === '1'
}

export function GameScreen({ onClose, telegramId, defaultNickname, isAdmin = false }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [gameState, setGameState] = useState<GameStateSnapshot>({
    health: 3, distance: 0, time: 0,
    biomeIndex: 0, status: 'idle', biomeName: '', incomingBiomeName: null, godMode: false,
    nextRival: null,
    coinsCollected: 0,
  })

  const storedNickname = localStorage.getItem(getNicknameKey(telegramId))
  const [nickname, setNickname] = useState(storedNickname || '')
  const [nicknameReady, setNicknameReady] = useState(!!storedNickname)

  const [rivals, setRivals] = useState<Rival[]>([])
  const [personalBest, setPersonalBest] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [dayRank, setDayRank] = useState<number | null>(null)
  const [overtakeEvent, setOvertakeEvent] = useState<OvertakeEvent | null>(null)
  const [overtakeEventId, setOvertakeEventId] = useState(0)
  const [overtakes, setOvertakes] = useState(0)
  const scoreSubmittedRef = useRef(false)
  const overtakeToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [profile, setProfile] = useState<GameProfile | null>(null)
  const [lastRunStreak, setLastRunStreak] = useState<{ streakDays: number; streakContinues: boolean } | null>(null)
  const [newlyUnlockedSkins, setNewlyUnlockedSkins] = useState<string[]>([])
  const [skinSheetOpen, setSkinSheetOpen] = useState(false)

  const [pickupToast, setPickupToast] = useState<
    { id: number; delta: number; total: number; isFirst: boolean } | null
  >(null)
  const pickupToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const prevCoinsRef = useRef(0)

  const biomeOrder = useMemo(() => getDailyBiomeOrder(todayMskIso()), [])

  const [adminPreviewNoDamage, setAdminPreviewNoDamage] = useState(() =>
    readAdminPreviewNoDamage(telegramId),
  )

  useEffect(() => {
    setAdminPreviewNoDamage(readAdminPreviewNoDamage(telegramId))
  }, [telegramId])

  const persistAdminPreview = useCallback((value: boolean) => {
    setAdminPreviewNoDamage(value)
    localStorage.setItem(getAdminPreviewKey(telegramId), value ? '1' : '0')
  }, [telegramId])

  const godModeActive = isAdmin && adminPreviewNoDamage

  const loadRivals = useCallback(() => {
    if (!telegramId) return
    fetchGameRivals(telegramId)
      .then((res) => {
        const pool = res.rivals.map(fromRosterEntry)
        setRivals(pool)
        engineRef.current?.setRivals(pool)
      })
      .catch(() => {})
  }, [telegramId])

  const loadProfile = useCallback(() => {
    if (!telegramId) return
    fetchGameProfile(telegramId)
      .then((p) => {
        setProfile(p)
        engineRef.current?.setActiveSkin(p.active_skin)
      })
      .catch(() => {})
  }, [telegramId])

  useEffect(() => {
    loadRivals()
    loadProfile()
  }, [loadRivals, loadProfile])

  useEffect(() => {
    if (
      gameState.status !== 'gameOver' ||
      scoreSubmittedRef.current ||
      !telegramId ||
      !nickname ||
      godModeActive
    ) return

    scoreSubmittedRef.current = true
    const dist = Math.floor(gameState.distance)
    const coins = gameState.coinsCollected ?? 0

    submitGameScore(telegramId, nickname, dist, coins)
      .then((res) => {
        setPersonalBest(res.best_distance)
        setIsNewRecord(res.is_new_record)
        setLastRunStreak({
          streakDays: res.streak_days,
          streakContinues: res.streak_continues,
        })
        setNewlyUnlockedSkins(res.newly_unlocked_skins ?? [])
        loadRivals()
        loadProfile()
        fetchMyStats(telegramId, 'day')
          .then((s) => setDayRank(s.rank ?? null))
          .catch(() => {})
      })
      .catch(() => {})
  }, [
    gameState.status,
    gameState.distance,
    gameState.coinsCollected,
    telegramId,
    nickname,
    godModeActive,
    loadRivals,
    loadProfile,
  ])

  const handleResize = useCallback(() => {
    const engine = engineRef.current
    const canvas = canvasRef.current
    if (!engine || !canvas) return

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    engine.resize(w, h)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(canvas)
    engineRef.current = engine

    engine.onStateChange = (state) => {
      setGameState(state)
    }

    engine.onOvertake = (event) => {
      setOvertakes((n) => n + 1)
      setOvertakeEvent(event)
      setOvertakeEventId((id) => id + 1)
      if (overtakeToastTimerRef.current) clearTimeout(overtakeToastTimerRef.current)
      overtakeToastTimerRef.current = setTimeout(() => setOvertakeEvent(null), 1400)
    }

    handleResize()
    engine.setBiomeOrder(biomeOrder)
    engine.beginIdle()
    window.addEventListener('resize', handleResize)

    return () => {
      if (overtakeToastTimerRef.current) clearTimeout(overtakeToastTimerRef.current)
      engine.destroy()
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize, biomeOrder])

  useEffect(() => {
    engineRef.current?.setGodMode(godModeActive)
  }, [godModeActive])

  useEffect(() => {
    if (rivals.length) engineRef.current?.setRivals(rivals)
  }, [rivals])

  useEffect(() => {
    engineRef.current?.setActiveSkin(profile?.active_skin ?? null)
  }, [profile?.active_skin])

  // Pickup feedback: show an explanatory toast when a coin is collected during
  // play. The very first pickup of a run includes the "why" line; later pickups
  // just flash a compact "+N 🪙" so we don't spam the screen.
  useEffect(() => {
    const now = gameState.coinsCollected ?? 0
    const prev = prevCoinsRef.current
    prevCoinsRef.current = now
    if (gameState.status !== 'playing') return
    if (now <= prev) return
    const isFirst = prev === 0
    setPickupToast({ id: Date.now(), delta: now - prev, total: now, isFirst })
    if (pickupToastTimerRef.current) clearTimeout(pickupToastTimerRef.current)
    pickupToastTimerRef.current = setTimeout(
      () => setPickupToast(null),
      isFirst ? 3200 : 1600,
    )
  }, [gameState.coinsCollected, gameState.status])

  useEffect(() => {
    if (gameState.status !== 'playing') {
      prevCoinsRef.current = 0
      setPickupToast(null)
      if (pickupToastTimerRef.current) clearTimeout(pickupToastTimerRef.current)
    }
  }, [gameState.status])

  useEffect(() => {
    return () => {
      if (pickupToastTimerRef.current) clearTimeout(pickupToastTimerRef.current)
    }
  }, [])

  const handleStart = useCallback(() => {
    scoreSubmittedRef.current = false
    setIsNewRecord(false)
    setDayRank(null)
    setOvertakes(0)
    setOvertakeEvent(null)
    setLastRunStreak(null)
    setNewlyUnlockedSkins([])
    setSkinSheetOpen(false)
    engineRef.current?.setBiomeOrder(biomeOrder)
    engineRef.current?.start()
  }, [biomeOrder])

  const handleRestart = useCallback(() => {
    scoreSubmittedRef.current = false
    setIsNewRecord(false)
    setDayRank(null)
    setOvertakes(0)
    setOvertakeEvent(null)
    setLastRunStreak(null)
    setNewlyUnlockedSkins([])
    setSkinSheetOpen(false)
    engineRef.current?.stop()
    engineRef.current?.setBiomeOrder(biomeOrder)
    engineRef.current?.start()
  }, [biomeOrder])

  const handleSelectSkin = useCallback((skinKey: string) => {
    if (!telegramId) return
    const prev = profile?.active_skin ?? DEFAULT_SKIN_KEY
    if (skinKey === prev) return
    setProfile((p) => (p ? { ...p, active_skin: skinKey } : p))
    engineRef.current?.setActiveSkin(skinKey)
    patchGameActiveSkin(telegramId, skinKey).catch(() => {
      setProfile((p) => (p ? { ...p, active_skin: prev } : p))
      engineRef.current?.setActiveSkin(prev)
    })
  }, [telegramId, profile?.active_skin])

  return (
    <div className="fixed inset-0 z-50 bg-bg overflow-hidden" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="block"
        style={{ touchAction: 'none' }}
      />

      {gameState.status === 'playing' && (
        <>
          <BiomeIntroOverlay title={gameState.incomingBiomeName} />
          <GameHUD
            health={gameState.health}
            distance={gameState.distance}
            time={gameState.time}
            coinsCollected={gameState.coinsCollected}
            godMode={gameState.godMode}
            showAdminPreviewToggle={isAdmin}
            adminPreviewNoDamage={adminPreviewNoDamage}
            onAdminPreviewChange={persistAdminPreview}
          />
          <RivalTracker nextRival={gameState.nextRival} />
          <OvertakeOverlay event={overtakeEvent} eventId={overtakeEventId} />
          <CoinPickupToast toast={pickupToast} />
        </>
      )}

      {gameState.status === 'idle' && (
        <StartScreen
          onStart={handleStart}
          nickname={nickname}
          defaultNickname={defaultNickname}
          nicknameReady={nicknameReady}
          showAdminPreviewToggle={isAdmin}
          adminPreviewNoDamage={adminPreviewNoDamage}
          onAdminPreviewChange={persistAdminPreview}
          biomeOrder={biomeOrder}
          profile={profile}
          onOpenSkins={() => setSkinSheetOpen(true)}
          onNicknameConfirm={(name) => {
            const trimmed = name.trim() || defaultNickname || 'Player'
            setNickname(trimmed)
            localStorage.setItem(getNicknameKey(telegramId), trimmed)
            setNicknameReady(true)
          }}
        />
      )}

      {gameState.status === 'idle' && skinSheetOpen && (
        <SkinSelectSheet
          open={skinSheetOpen}
          profile={profile}
          onSelect={handleSelectSkin}
          onClose={() => setSkinSheetOpen(false)}
        />
      )}

      {gameState.status === 'gameOver' && (
        <GameOverScreen
          distance={gameState.distance}
          time={gameState.time}
          biomeIndex={gameState.biomeIndex}
          personalBest={personalBest}
          isNewRecord={isNewRecord}
          dayRank={dayRank}
          rivals={rivals}
          overtakes={overtakes}
          streak={lastRunStreak}
          coinsCollected={gameState.coinsCollected}
          newlyUnlockedSkins={newlyUnlockedSkins}
          onRestart={handleRestart}
          onClose={onClose}
        />
      )}

      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-40 w-8 h-8 flex items-center justify-center bg-bg-card/80 border border-border rounded-sm text-text-muted text-xs cursor-pointer pointer-events-auto"
      >
        ×
      </button>
    </div>
  )
}

interface PickupToastState {
  id: number
  delta: number
  total: number
  isFirst: boolean
}

function CoinPickupToast({ toast }: { toast: PickupToastState | null }) {
  if (!toast) return null
  return (
    <div
      key={toast.id}
      className="pointer-events-none absolute inset-x-0 top-40 z-20 flex justify-center px-4"
      style={{
        animation: toast.isFirst
          ? 'overtake-toast-in 3.2s ease-out forwards'
          : 'overtake-toast-in 1.6s ease-out forwards',
      }}
    >
      <div className="relative overflow-hidden rounded-sm border border-accent/45 bg-black/80 px-3 py-1.5 shadow-[0_0_22px_rgba(213,96,0,0.35)] backdrop-blur-sm">
        <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-linear-to-b from-accent via-accent/60 to-accent/15" />
        <div className="relative flex flex-col items-center text-center">
          <span className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-accent">
            +{toast.delta} 🪙 Монет{toast.delta === 1 ? 'а' : toast.delta < 5 ? 'ы' : ''}
          </span>
          {toast.isFirst && (
            <span className="mt-0.5 text-[9px] leading-snug text-text-muted">
              копите 🪙 - они открывают новые скины лисы
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
