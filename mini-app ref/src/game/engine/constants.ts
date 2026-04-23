import type { BiomeConfig, BiomeVisual, FoxAnimation } from './types'

export const BASE_SPEED = 5
export const SPEED_MULTIPLIER = 1.25
export const BIOME_DURATION_S = 40
export const MAX_BIOMES = 6

export const GRAVITY = 0.6
export const JUMP_VELOCITY = -14
export const FAST_FALL_VELOCITY = 18
export const GROUND_Y_RATIO = 0.78

export const MAX_HEALTH = 3
export const INVULNERABLE_DURATION_S = 1.5
export const STUN_RECOVERY_S = 3
export const KNOCKBACK_PX = 120

export const FOX_WIDTH = 80
export const FOX_HEIGHT = 80
/** Tumble / slide: smaller than stand so the fox can pass under aerial obstacles. */
export const FOX_CROUCH_WIDTH = 45
export const FOX_CROUCH_HEIGHT = 35
export const FOX_X_RATIO = 0.15

export const OBSTACLE_MIN_GAP_S = 0.9
export const OBSTACLE_MAX_GAP_S = 1.6
export const OBSTACLE_FIRST_GAP_S = 2.0
export const OBSTACLE_GROUND_WIDTH = 35
export const OBSTACLE_GROUND_HEIGHT = 50
export const OBSTACLE_AERIAL_WIDTH = 50
export const OBSTACLE_AERIAL_HEIGHT = 35
export const AERIAL_OBSTACLE_CHANCE = 0.3

export const SCREEN_SHAKE_DURATION_MS = 300
export const SCREEN_SHAKE_INTENSITY = 8
export const RED_FLASH_DURATION_MS = 200

export const PARTICLE_MAX = 80
export const DUST_INTERVAL = 0.05

export const BIOME_TRANSITION_S = 2

/** Run order = array order. Reorder entries freely; keep each `visual` matching the theme. */
export const BIOMES: BiomeConfig[] = [
  {
    visual: 'desert',
    name: 'Пустыня без интернета',
    skyTop: '#3d1200',
    skyBottom: '#a03800',
    groundColor: '#c2a05a',
    groundLine: '#d4b36a',
    obstacleColors: ['#2d6e1e', '#3a8c28', '#1f5214'],
    decorationTypes: ['dune', 'cloud', 'tumbleweed'],
  },
  {
    visual: 'forest',
    name: 'Заблокированный лес',
    skyTop: '#0a1f0a',
    skyBottom: '#1a3d1a',
    groundColor: '#3a5c28',
    groundLine: '#4a7030',
    obstacleColors: ['#5c3a1e', '#7a4e2a', '#4a2e14'],
    decorationTypes: ['pine', 'bush', 'bird'],
  },
  {
    visual: 'ice',
    name: 'Замедленные горы',
    skyTop: '#080f1e',
    skyBottom: '#1a3a5c',
    groundColor: '#6e7c84',
    groundLine: '#90a8b4',
    obstacleColors: ['#7ab8d4', '#5e9ab8', '#8ccce6'],
    decorationTypes: ['mountain', 'snowflake', 'icicle'],
  },
  {
    visual: 'night',
    name: 'Кладбище IP адресов',
    skyTop: '#050510',
    skyBottom: '#0a0a2e',
    groundColor: '#2a2a3e',
    groundLine: '#3a3a50',
    obstacleColors: ['#6a4ea0', '#8060c0', '#5040a0'],
    decorationTypes: ['moon', 'star', 'firefly'],
  },
  {
    visual: 'lava',
    name: 'Офис РКН',
    skyTop: '#0e0300',
    skyBottom: '#3a0800',
    groundColor: '#2e1205',
    groundLine: '#8b2e00',
    obstacleColors: ['#c03000', '#e05010', '#801a00'],
    decorationTypes: ['volcano', 'ember', 'smoke'],
  },
  {
    visual: 'city',
    name: 'Город с белыми списками',
    skyTop: '#0c1020',
    skyBottom: '#2a3a55',
    groundColor: '#3a3d48',
    groundLine: '#5a5e6a',
    obstacleColors: ['#166534', '#facc15', '#14532d'],
    decorationTypes: ['skyscraper', 'neon', 'smog'],
  },
]

export function biomeVisualAt(index: number): BiomeVisual {
  const b = BIOMES[index]
  return b?.visual ?? 'desert'
}

export interface AnimFrameConfig {
  frames: string[]
  paths: string[]
  frameDuration: number
  loop: boolean
}

export const FOX_ANIMATIONS: Record<FoxAnimation, AnimFrameConfig> = {
  run: {
    frames: ['run1', 'run2', 'run3', 'run4', 'run5', 'run6'],
    paths: [
      '/assets/game/fox-run-1.webp',
      '/assets/game/fox-run-2.webp',
      '/assets/game/fox-run-3.webp',
      '/assets/game/fox-run-4.webp',
      '/assets/game/fox-run-5.webp',
      '/assets/game/fox-run-6.webp',
    ],
    frameDuration: 0.09,
    loop: true,
  },
  jump: {
    frames: ['jumpUp', 'jumpPeak', 'jumpDown'],
    paths: [
      '/assets/game/fox-jump-up.webp',
      '/assets/game/fox-jump-up.webp',
      '/assets/game/fox-jump-down.webp',
    ],
    frameDuration: 0.12,
    loop: false,
  },
  crouch: {
    frames: ['crouch1', 'crouch2', 'crouch3'],
    paths: [
      '/assets/game/fox-spy/fox-crouch-1.webp',
      '/assets/game/fox-spy/fox-crouch-2.webp',
      '/assets/game/fox-spy/fox-crouch-3.webp',
    ],
    frameDuration: 0.05,
    loop: true,
  },
  hurt: {
    frames: ['hurt1', 'hurt2'],
    paths: [
      '/assets/game/fox-hurt-1.webp',
      '/assets/game/fox-hurt-1.webp',
    ],
    frameDuration: 0.15,
    loop: true,
  },
  land: {
    frames: ['land1'],
    paths: [
      '/assets/game/fox-run-1.webp',
    ],
    frameDuration: 0.12,
    loop: false,
  },
}

/**
 * Fox skins unlocked by `total_coins`.
 *
 * - `fox_default` is always unlocked (threshold 0) and is the base sprite set.
 * - `fox_fire` reuses the default sprite set but applies a canvas `filter`
 *   (warm tint + glow) and emits an ember trail particle overlay.
 * - `fox_spy` uses `/assets/game/fox-spy/*.webp`. Missing poses reuse the
 *   closest shipped frame (same folder) so we do not flash the orange
 *   default set mid-run. Optional `hood.webp` overlay is off when the art
 *   already includes a hood.
 */
export type SkinKey = 'fox_default' | 'fox_spy' | 'fox_fire'
export type SkinSpriteSet = 'default' | 'spy'
export type SkinOverlay = 'hood' | 'fire_trail'

export interface SkinDef {
  key: SkinKey
  label: string
  description: string
  unlockAt: number
  spriteSet: SkinSpriteSet
  /** Canvas filter applied while drawing the base sprite. */
  filter?: string
  /** Glow tint around the sprite (rgba). */
  glow?: string
  overlay?: SkinOverlay
  /** Emoji / symbol shown on the skin picker when no asset is ready. */
  icon: string
  /** Swatch color (hex) used in skin picker tiles and start screen chip. */
  swatch: string
}

export const SKINS: readonly SkinDef[] = [
  {
    key: 'fox_default',
    label: 'Annet',
    description: 'Та самая рыжая лиса. Открыт с первой пробежки.',
    unlockAt: 0,
    spriteSet: 'default',
    icon: '🦊',
    swatch: '#D56000',
  },
  {
    key: 'fox_spy',
    label: 'Лис-шпион',
    description: 'Чёрный капюшон, тихий шаг, никаких следов в логах.',
    unlockAt: 40,
    spriteSet: 'spy',
    icon: '🥷',
    swatch: '#1a1d24',
  },
  {
    key: 'fox_fire',
    label: 'Огненный лис',
    description: 'Горячий хвост, тёплый хайлайт - срывает белые списки.',
    unlockAt: 80,
    spriteSet: 'default',
    filter: 'saturate(1.45) hue-rotate(-14deg) brightness(1.08) contrast(1.08)',
    glow: 'rgba(255,110,30,0.55)',
    overlay: 'fire_trail',
    icon: '🔥',
    swatch: '#ff5a1f',
  },
]

export const DEFAULT_SKIN_KEY: SkinKey = 'fox_default'

export function getSkin(key: string | null | undefined): SkinDef {
  if (!key) return SKINS[0]
  return SKINS.find((s) => s.key === key) ?? SKINS[0]
}

export const SPY_FOX_ANIMATIONS: Record<FoxAnimation, AnimFrameConfig> = {
  run: {
    ...FOX_ANIMATIONS.run,
    paths: [
      '/assets/game/fox-spy/fox-run-1.webp',
      '/assets/game/fox-spy/fox-run-2.webp',
      '/assets/game/fox-spy/fox-run-3.webp',
      '/assets/game/fox-spy/fox-run-4.webp',
      '/assets/game/fox-spy/fox-run-5.webp',
      '/assets/game/fox-spy/fox-run-6.webp',
    ],
  },
  jump: {
    ...FOX_ANIMATIONS.jump,
    paths: [
      '/assets/game/fox-spy/jump-up.webp',
      '/assets/game/fox-spy/jump-up.webp',
      '/assets/game/fox-spy/jump-up.webp',
    ],
  },
  crouch: {
    ...FOX_ANIMATIONS.crouch,
    paths: [
      '/assets/game/fox-spy/fox-crouch-1.webp',
      '/assets/game/fox-spy/fox-crouch-2.webp',
      '/assets/game/fox-spy/fox-crouch-3.webp',
    ],
  },
  hurt: {
    ...FOX_ANIMATIONS.hurt,
    paths: [
      '/assets/game/fox-spy/fox-hurt-1.webp',
      '/assets/game/fox-spy/fox-hurt-1.webp',
    ],
  },
  land: {
    ...FOX_ANIMATIONS.land,
    paths: ['/assets/game/fox-spy/fox-run-1.webp'],
  },
}

export const SPY_HOOD_OVERLAY_PATH = '/assets/game/skins/hood.webp'

export const COIN_SPAWN_MIN_S = 15
export const COIN_SPAWN_MAX_S = 25
export const COIN_FIRST_GAP_S = 10
export const COIN_WIDTH = 34
export const COIN_HEIGHT = 34
export const COIN_SPRITE_PATH = '/assets/game/collectibles/coin.webp'

export const OBSTACLE_SPRITE_PATHS: Record<BiomeVisual, { ground: string[]; aerial: string }> = {
  desert: {
    ground: [
      '/assets/game/obstacles/desert-ground.webp',
      '/assets/game/obstacles/desert-ground-2.webp',
      '/assets/game/obstacles/desert-ground-3.webp',
    ],
    aerial: '/assets/game/obstacles/desert-aerial.webp',
  },
  forest: {
    ground: [
      '/assets/game/obstacles/forest-ground.webp',
      '/assets/game/obstacles/forest-ground-2.webp',
      '/assets/game/obstacles/forest-ground-3.webp',
    ],
    aerial: '/assets/game/obstacles/forest-aerial.webp',
  },
  ice: {
    ground: [
      '/assets/game/obstacles/snow-ground.webp',
      '/assets/game/obstacles/snow-ground-2.webp',
      '/assets/game/obstacles/snow-ground-3.webp',
    ],
    aerial: '/assets/game/obstacles/snow-aerial.webp',
  },
  night: {
    ground: [
      '/assets/game/obstacles/night-ground.webp',
      '/assets/game/obstacles/night-ground-2.webp',
      '/assets/game/obstacles/night-ground-3.webp',
    ],
    aerial: '/assets/game/obstacles/night-aerial.webp',
  },
  lava: {
    ground: [
      '/assets/game/obstacles/lava-ground.webp',
      '/assets/game/obstacles/lava-ground-2.webp',
      '/assets/game/obstacles/lava-ground-3.webp',
    ],
    aerial: '/assets/game/obstacles/lava-aerial.webp',
  },
  city: {
    ground: [
      '/assets/game/obstacles/city-ground-bollard.webp',
      '/assets/game/obstacles/city-ground-trash.webp',
      '/assets/game/obstacles/city-ground-bollard-2.webp',
    ],
    aerial: '/assets/game/obstacles/city-aerial-pigeon.webp',
  },
}
