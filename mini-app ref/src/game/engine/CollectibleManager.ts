import type { Collectible, Obstacle, Rect } from './types'
import {
  GROUND_Y_RATIO,
  COIN_SPAWN_MIN_S, COIN_SPAWN_MAX_S, COIN_FIRST_GAP_S,
  COIN_WIDTH, COIN_HEIGHT, COIN_SPRITE_PATH,
} from './constants'

/** Min horizontal gap (px) to keep between a collectible and any obstacle. */
const OBSTACLE_AVOID_MARGIN = 36
/** Give up after this many shift iterations - then drop the spawn. */
const MAX_AVOID_ITERATIONS = 8

/**
 * Spawns collectible Annet coins along the run. Spawn cadence is time-based
 * (15–25 seconds of game time) so it feels independent of speed ramp and
 * doesn't drown out obstacles. One type only; position alternates between a
 * low band (collect by running/crouching) and a high band (collect by jumping).
 */
export class CollectibleManager {
  collectibles: Collectible[] = []
  private canvasW = 0
  private groundY = 0
  private spawnTimerS = 0
  private nextSpawnS = 0

  private sprite: HTMLImageElement
  private spriteReady = false

  constructor() {
    this.sprite = new Image()
    this.sprite.src = COIN_SPRITE_PATH
    this.sprite.onload = () => { this.spriteReady = true }
    this.sprite.onerror = () => { this.spriteReady = false }
  }

  resize(canvasW: number, canvasH: number) {
    this.canvasW = canvasW
    this.groundY = canvasH * GROUND_Y_RATIO
  }

  reset() {
    this.collectibles = []
    this.spawnTimerS = 0
    this.nextSpawnS = COIN_FIRST_GAP_S
  }

  private randomGapS(): number {
    return COIN_SPAWN_MIN_S + Math.random() * (COIN_SPAWN_MAX_S - COIN_SPAWN_MIN_S)
  }

  update(speed: number, dt: number, obstacles: Obstacle[] = []) {
    const pxPerFrame = speed * dt * 60

    for (const c of this.collectibles) {
      c.x -= pxPerFrame
    }
    this.collectibles = this.collectibles.filter((c) => c.x + c.width > -50 && !c.collected)

    this.spawnTimerS += dt
    if (this.spawnTimerS >= this.nextSpawnS) {
      this.spawnTimerS = 0
      this.nextSpawnS = this.randomGapS()
      this.spawn(obstacles)
    }
  }

  knockback(px: number) {
    for (const c of this.collectibles) c.x += px
  }

  /** Returns number of collectibles intersecting `foxRect`; marks them collected. */
  collectColliding(foxRect: Rect): number {
    let count = 0
    for (const c of this.collectibles) {
      if (c.collected) continue
      if (
        c.x < foxRect.x + foxRect.width &&
        c.x + c.width > foxRect.x &&
        c.y < foxRect.y + foxRect.height &&
        c.y + c.height > foxRect.y
      ) {
        c.collected = true
        count++
      }
    }
    return count
  }

  /**
   * Pick a spawn slot that doesn't sit on top of an obstacle.
   *
   * Everything scrolls at the same speed, so overlap at spawn time means
   * permanent overlap. Strategy: pick a vertical band (low/high), then shift
   * the collectible right past any obstacle whose y-range overlaps. Shifting
   * repeats in case pushing past one obstacle lands on another. If a clean
   * slot can't be found in `MAX_AVOID_ITERATIONS` steps, try the other band;
   * if that also fails, drop the spawn entirely (skipping one certificate is
   * much better than placing it inside a cactus).
   */
  private spawn(obstacles: Obstacle[]) {
    const preferHigh = Math.random() < 0.5
    const first = this.tryPlace(preferHigh, obstacles)
    if (first) {
      this.pushCollectible(first.x, first.y)
      return
    }
    const second = this.tryPlace(!preferHigh, obstacles)
    if (second) {
      this.pushCollectible(second.x, second.y)
    }
  }

  private tryPlace(
    isHigh: boolean,
    obstacles: Obstacle[],
  ): { x: number; y: number } | null {
    const y = isHigh
      ? this.groundY - 100 - Math.random() * 10
      : this.groundY - 52 - Math.random() * 8
    const w = COIN_WIDTH
    const h = COIN_HEIGHT

    let x = this.canvasW + 30

    for (let i = 0; i < MAX_AVOID_ITERATIONS; i++) {
      let conflict: Obstacle | null = null
      for (const obs of obstacles) {
        const yOverlap = !(y + h < obs.y || y > obs.y + obs.height)
        if (!yOverlap) continue
        const xOverlap = !(x + w + OBSTACLE_AVOID_MARGIN < obs.x || x > obs.x + obs.width + OBSTACLE_AVOID_MARGIN)
        if (!xOverlap) continue
        if (!conflict || obs.x > conflict.x) conflict = obs
      }
      if (!conflict) return { x, y }
      x = conflict.x + conflict.width + OBSTACLE_AVOID_MARGIN
    }

    return null
  }

  private pushCollectible(x: number, y: number) {
    this.collectibles.push({
      x,
      y,
      width: COIN_WIDTH,
      height: COIN_HEIGHT,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    })
  }

  render(ctx: CanvasRenderingContext2D, time: number) {
    for (const c of this.collectibles) {
      if (c.collected) continue
      const bob = Math.sin(time * 3 + c.bobPhase) * 3
      const x = c.x
      const y = c.y + bob

      ctx.save()
      ctx.shadowColor = 'rgba(255,200,80,0.55)'
      ctx.shadowBlur = 10

      if (this.spriteReady && this.sprite.complete && this.sprite.naturalWidth > 0) {
        ctx.drawImage(this.sprite, x, y, c.width, c.height)
      } else {
        this.drawFallback(ctx, x, y, c.width, c.height, time + c.bobPhase)
      }

      ctx.restore()
    }
  }

  /**
   * Programmatic gold coin with a fox silhouette. Used when `coin.webp` hasn't
   * loaded yet (or is missing). Flattens to a yellow disc with an "A" monogram
   * so the pickup still reads as a coin at a glance.
   */
  private drawFallback(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    time: number,
  ) {
    const cx = x + w / 2
    const cy = y + h / 2
    const r = Math.min(w, h) / 2 - 1

    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r)
    grad.addColorStop(0, '#fff3b0')
    grad.addColorStop(0.55, '#ffc447')
    grad.addColorStop(1, '#b8760a')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#7a4a05'
    ctx.lineWidth = 1.2
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255,236,170,0.65)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, r - 3, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#6b3e02'
    ctx.font = `bold ${Math.floor(r * 1.1)}px "Inter", system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('A', cx, cy + 1)

    const shine = 0.35 + Math.sin(time * 4) * 0.2
    ctx.fillStyle = `rgba(255,255,220,${shine})`
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.45, cy - r * 0.5, r * 0.3, r * 0.18, -0.4, 0, Math.PI * 2)
    ctx.fill()
  }
}
