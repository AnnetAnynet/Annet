import type { RivalRole } from '../../api/types'

export type GameStatus = 'idle' | 'playing' | 'gameOver'

export type FoxAnimation = 'run' | 'jump' | 'crouch' | 'hurt' | 'land'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Vec2 {
  x: number
  y: number
}

export interface FoxState {
  x: number
  y: number
  velocityY: number
  width: number
  height: number
  isOnGround: boolean
  isJumping: boolean
  isCrouching: boolean
  animation: FoxAnimation
  animationFrame: number
  animationTimer: number
}

export type ObstacleType = 'ground' | 'aerial'

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
  type: ObstacleType
  biomeIndex: number
  passed: boolean
  animPhase: number
  variant: number
}

export interface Collectible {
  x: number
  y: number
  width: number
  height: number
  collected: boolean
  bobPhase: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}

export interface BackgroundElement {
  x: number
  y: number
  width: number
  height: number
  speed: number
  type: string
  biomeIndex: number
}

/** Visual theme: art, obstacles, and atmosphere. Independent of order in `BIOMES`. */
export type BiomeVisual = 'desert' | 'forest' | 'ice' | 'night' | 'lava' | 'city'

export interface BiomeConfig {
  /** Theme for sprites and background drawing - not the run order */
  visual: BiomeVisual
  name: string
  skyTop: string
  skyBottom: string
  groundColor: string
  groundLine: string
  obstacleColors: string[]
  decorationTypes: string[]
}

export interface NextRivalInfo {
  nickname: string
  metersAhead: number
  role: RivalRole
  /** True only for the player's own PB-ghost. */
  isSelf: boolean
  rankDay?: number
  rankWeek?: number
  rankAll?: number
}

export interface OvertakeEvent {
  nickname: string
  bestDistance: number
  role: RivalRole
  isSelf: boolean
  rankDay?: number
  rankWeek?: number
  rankAll?: number
  /** Player's total distance at the moment of overtake. */
  atDistance: number
}

export interface GameStateSnapshot {
  health: number
  distance: number
  time: number
  biomeIndex: number
  status: GameStatus
  biomeName: string
  /** Name of the biome being entered (only while cross-fade transition runs). */
  incomingBiomeName: string | null
  /** Admin preview: no damage from obstacles */
  godMode?: boolean
  /** Closest rival ahead of the player (or null if none). */
  nextRival: NextRivalInfo | null
  /** Annet coins collected in the current run. */
  coinsCollected: number
}
