import type { Rival } from '../rivals'
import type { NextRivalInfo, OvertakeEvent } from './types'
import {
  FOX_WIDTH,
  FOX_HEIGHT,
  FOX_X_RATIO,
  GROUND_Y_RATIO,
  FOX_ANIMATIONS,
} from './constants'

/**
 * Pixel-to-meter conversion derived from engine scroll:
 *   distance += speed * dt * 10   (meters accumulated)
 *   pxPerFrame = speed * dt * 60  (obstacle/world scroll speed)
 *  =>  60 / 10 = 6 pixels per meter.
 *
 * If those constants in GameEngine/ObstacleManager ever change, update here too.
 */
const PX_PER_METER = 6

/**
 * Sliding render window in meters. Ghosts outside this band are skipped so
 * a far-away rival (e.g. all-time leader at 15k) doesn't add draw cost or
 * visual noise. Tuned for mobile canvas widths.
 */
const RENDER_WINDOW_AHEAD_M = 600
const RENDER_WINDOW_BEHIND_M = 20

/**
 * Ghost is visually the same size as the player - it reuses the running fox
 * frames, but with a cool tint, low alpha and a permanent nickname label so it
 * reads as "another player's echo" rather than a solid obstacle.
 */
const GHOST_ALPHA_BASE = 0.35
/** Desaturate + rotate warm fox fur toward cool cyan/blue (other players). */
const GHOST_TINT_FILTER = 'saturate(0.25) brightness(1.15) hue-rotate(180deg)'
const GHOST_GLOW_COLOR = 'rgba(140, 200, 255, 0.7)'
const GHOST_GLOW_BLUR = 18

/**
 * PB-ghost (player's own previous best) uses a warm amber tone instead of the
 * "other player" cyan, so players instantly read it as "that's me".
 */
const SELF_TINT_FILTER = 'saturate(0.75) brightness(1.05)'
const SELF_GLOW_COLOR = 'rgba(255, 190, 110, 0.6)'
const SELF_GLOW_BLUR = 16

const GHOST_LABEL_FONT =
  '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
const GHOST_LABEL_BG = 'rgba(12, 18, 30, 0.72)'
const GHOST_LABEL_TEXT = '#cfe3ff'
const GHOST_LABEL_TEXT_SELF = '#ffd59a'
const GHOST_LABEL_PADDING_X = 6
const GHOST_LABEL_PADDING_Y = 3
const GHOST_LABEL_RADIUS = 8
const GHOST_LABEL_TEXT_HEIGHT = 11
/** Distance from the top of the ghost sprite to the bottom of the label. */
const GHOST_LABEL_GAP = 10
const GHOST_NICK_MAX_CHARS = 12

const FLASH_DURATION_S = 0.6

interface GhostState {
  rival: Rival
  overtaken: boolean
  flashTimer: number
  /** Captured at overtake moment so the flash anchors even as the world scrolls. */
  flashAnchorX: number
  flashAnchorY: number
  animFrame: number
  animTimer: number
}

export class GhostManager {
  private ghosts: GhostState[] = []
  private canvasW = 0
  private canvasH = 0
  private runFrames: HTMLImageElement[] = []

  /** Consumer sets this to receive overtake events. */
  onOvertake: ((event: OvertakeEvent) => void) | null = null

  constructor() {
    this.loadRunFrames()
  }

  private loadRunFrames() {
    for (const path of FOX_ANIMATIONS.run.paths) {
      const img = new Image()
      img.src = path
      this.runFrames.push(img)
    }
  }

  private isFrameReady(img: HTMLImageElement | undefined): img is HTMLImageElement {
    return !!img && img.complete && img.naturalWidth > 0
  }

  resize(canvasW: number, canvasH: number) {
    this.canvasW = canvasW
    this.canvasH = canvasH
  }

  /** Reload rivals. Sticky `overtaken` flags are reset - call this on new runs. */
  setRivals(rivals: Rival[]) {
    const frameDur = FOX_ANIMATIONS.run.frameDuration
    this.ghosts = rivals
      .filter((r) => Number.isFinite(r.bestDistance) && r.bestDistance > 0)
      .map((rival) => ({
        rival,
        overtaken: false,
        flashTimer: 0,
        flashAnchorX: 0,
        flashAnchorY: 0,
        animFrame: Math.floor((rival.bestDistance * 0.137) % FOX_ANIMATIONS.run.frames.length),
        // Stable phase offset so ghosts don't animate in lockstep.
        animTimer: ((rival.bestDistance * 0.091) % 1) * frameDur,
      }))
  }

  reset() {
    const frameDur = FOX_ANIMATIONS.run.frameDuration
    for (const g of this.ghosts) {
      g.overtaken = false
      g.flashTimer = 0
      g.flashAnchorX = 0
      g.flashAnchorY = 0
      g.animFrame = Math.floor(
        (g.rival.bestDistance * 0.137) % FOX_ANIMATIONS.run.frames.length,
      )
      g.animTimer = ((g.rival.bestDistance * 0.091) % 1) * frameDur
    }
  }

  /** Position of the fox in screen space (used for hit detection). */
  private foxCenterX(): number {
    return this.canvasW * FOX_X_RATIO + FOX_WIDTH * 0.5
  }

  /** Ground level in screen space. */
  private groundY(): number {
    return this.canvasH * GROUND_Y_RATIO
  }

  private screenXFor(bestDistance: number, currentDistance: number): number {
    const metersAhead = bestDistance - currentDistance
    return this.canvasW * FOX_X_RATIO + metersAhead * PX_PER_METER
  }

  update(_speed: number, dt: number, currentDistance: number): void {
    const foxCx = this.foxCenterX()
    const runCfg = FOX_ANIMATIONS.run
    const frameCount = runCfg.frames.length

    for (const g of this.ghosts) {
      g.animTimer += dt
      if (g.animTimer >= runCfg.frameDuration) {
        const advance = Math.floor(g.animTimer / runCfg.frameDuration)
        g.animFrame = (g.animFrame + advance) % frameCount
        g.animTimer -= advance * runCfg.frameDuration
      }

      if (!g.overtaken) {
        const ghostCx = this.screenXFor(g.rival.bestDistance, currentDistance) + FOX_WIDTH * 0.5
        if (ghostCx <= foxCx) {
          g.overtaken = true
          g.flashTimer = FLASH_DURATION_S
          g.flashAnchorX = foxCx - FOX_WIDTH * 0.5
          g.flashAnchorY = this.groundY() - FOX_HEIGHT
          this.onOvertake?.({
            nickname: g.rival.nickname,
            bestDistance: g.rival.bestDistance,
            role: g.rival.role,
            isSelf: g.rival.isSelf,
            rankDay: g.rival.rankDay,
            rankWeek: g.rival.rankWeek,
            rankAll: g.rival.rankAll,
            atDistance: currentDistance,
          })
        }
      } else if (g.flashTimer > 0) {
        g.flashTimer = Math.max(0, g.flashTimer - dt)
      }
    }
  }

  /** Closest un-overtaken rival ahead (meters > 0), or null. */
  getNextRival(currentDistance: number): NextRivalInfo | null {
    let best: GhostState | null = null
    let bestAhead = Infinity
    for (const g of this.ghosts) {
      if (g.overtaken) continue
      const ahead = g.rival.bestDistance - currentDistance
      if (ahead > 0 && ahead < bestAhead) {
        bestAhead = ahead
        best = g
      }
    }
    if (!best) return null
    return {
      nickname: best.rival.nickname,
      metersAhead: bestAhead,
      role: best.rival.role,
      isSelf: best.rival.isSelf,
      rankDay: best.rival.rankDay,
      rankWeek: best.rival.rankWeek,
      rankAll: best.rival.rankAll,
    }
  }

  render(ctx: CanvasRenderingContext2D, time: number, currentDistance: number): void {
    const groundY = this.groundY()
    const baseY = groundY - FOX_HEIGHT

    for (const g of this.ghosts) {
      if (g.overtaken) {
        if (g.flashTimer <= 0) continue
        this.renderFlash(ctx, g, time)
        continue
      }

      // Sliding window by meters - keeps the track uncluttered. A rival
      // sitting at 5000m while the player is at 200m simply doesn't render.
      const metersAhead = g.rival.bestDistance - currentDistance
      if (metersAhead > RENDER_WINDOW_AHEAD_M) continue
      if (metersAhead < -RENDER_WINDOW_BEHIND_M) continue

      const screenX = this.screenXFor(g.rival.bestDistance, currentDistance)
      const proximity = 1 - Math.min(1, Math.max(0, metersAhead / 1200))
      const breathe = Math.sin(time * 2 + g.rival.bestDistance * 0.01) * 0.08
      const alpha = Math.max(0.18, Math.min(0.6, GHOST_ALPHA_BASE + breathe))
      const yBob = Math.sin(time * 3 + g.rival.bestDistance * 0.017) * 3

      const tintFilter = g.rival.isSelf ? SELF_TINT_FILTER : GHOST_TINT_FILTER
      const glowColor = g.rival.isSelf ? SELF_GLOW_COLOR : GHOST_GLOW_COLOR
      const glowBlur = g.rival.isSelf ? SELF_GLOW_BLUR : GHOST_GLOW_BLUR
      const auraColor = g.rival.isSelf
        ? 'rgba(255, 190, 110, 0.5)'
        : 'rgba(140, 200, 255, 0.55)'

      this.drawGhostAura(ctx, screenX + FOX_WIDTH / 2, groundY, time, proximity, auraColor)

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.filter = tintFilter
      ctx.shadowColor = glowColor
      ctx.shadowBlur = glowBlur
      this.drawSprite(ctx, screenX, baseY + yBob, FOX_WIDTH, FOX_HEIGHT, g.animFrame)
      ctx.restore()

      // Label stays readable regardless of sprite alpha - it's the strongest
      // "this is another player, not an obstacle" signal.
      this.drawLabel(ctx, screenX + FOX_WIDTH / 2, baseY + yBob - GHOST_LABEL_GAP, g.rival)
    }
  }

  private drawGhostAura(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    groundY: number,
    time: number,
    proximity: number,
    color: string,
  ) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 3 + centerX * 0.02)
    const rx = 18 + pulse * 4
    const ry = 3 + pulse * 1.2
    ctx.save()
    ctx.globalAlpha = 0.25 + 0.2 * proximity
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(centerX, groundY - 1, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private drawLabel(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    bottomY: number,
    rival: Rival,
  ) {
    const nick = this.truncateNick(rival.nickname)
    const text = this.labelTextFor(rival, nick)

    ctx.save()
    ctx.font = GHOST_LABEL_FONT
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    const textW = ctx.measureText(text).width
    const boxW = textW + GHOST_LABEL_PADDING_X * 2
    const boxH = GHOST_LABEL_TEXT_HEIGHT + GHOST_LABEL_PADDING_Y * 2
    const boxX = centerX - boxW / 2
    const boxY = bottomY - boxH

    ctx.globalAlpha = 0.92
    ctx.fillStyle = GHOST_LABEL_BG
    this.roundRectPath(ctx, boxX, boxY, boxW, boxH, GHOST_LABEL_RADIUS)
    ctx.fill()

    ctx.fillStyle = rival.isSelf ? GHOST_LABEL_TEXT_SELF : GHOST_LABEL_TEXT
    ctx.fillText(text, centerX, boxY + boxH / 2 + 0.5)
    ctx.restore()
  }

  /**
   * Compact role-aware label for the on-canvas ghost tag.
   * PB-ghost: "PB". Leaders: "DAY #1 nick". Others: just the nickname.
   */
  private labelTextFor(rival: Rival, nick: string): string {
    if (rival.isSelf) return 'PB'
    if (rival.role === 'day_leader') return `DAY #1 ${nick}`
    if (rival.role === 'week_leader') return `WEEK #1 ${nick}`
    if (rival.role === 'all_leader') return `TOP #1 ${nick}`
    return nick
  }

  private truncateNick(nick: string): string {
    if (nick.length <= GHOST_NICK_MAX_CHARS) return nick
    return nick.slice(0, GHOST_NICK_MAX_CHARS - 1) + '…'
  }

  private roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.lineTo(x + w - rr, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr)
    ctx.lineTo(x + w, y + h - rr)
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h)
    ctx.lineTo(x + rr, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr)
    ctx.lineTo(x, y + rr)
    ctx.quadraticCurveTo(x, y, x + rr, y)
    ctx.closePath()
  }

  private renderFlash(ctx: CanvasRenderingContext2D, g: GhostState, time: number) {
    const t = 1 - g.flashTimer / FLASH_DURATION_S
    const scale = 1 + t * 0.35
    const alpha = (1 - t) * 0.85
    const driftY = -t * 18
    const w = FOX_WIDTH * scale
    const h = FOX_HEIGHT * scale
    const x = g.flashAnchorX - (w - FOX_WIDTH) / 2
    const y = g.flashAnchorY - (h - FOX_HEIGHT) / 2 + driftY

    const isSelf = g.rival.isSelf
    const tintFilter = isSelf ? SELF_TINT_FILTER : GHOST_TINT_FILTER
    const glowColor = isSelf ? SELF_GLOW_COLOR : GHOST_GLOW_COLOR
    const glowBlur = isSelf ? SELF_GLOW_BLUR : GHOST_GLOW_BLUR
    const ringStroke = isSelf ? 'rgba(255, 210, 150, 0.95)' : 'rgba(180, 220, 255, 0.95)'

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.filter = tintFilter
    ctx.shadowColor = glowColor
    ctx.shadowBlur = glowBlur
    this.drawSprite(ctx, x, y, w, h, g.animFrame)
    ctx.restore()

    const cx = g.flashAnchorX + FOX_WIDTH / 2
    const cy = g.flashAnchorY + FOX_HEIGHT / 2 + driftY
    const ringRadius = 24 + t * 60
    ctx.save()
    ctx.globalAlpha = (1 - t) * 0.55
    ctx.strokeStyle = ringStroke
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    // Silence unused `time` lint (kept for future shimmer variations)
    void time
  }

  private drawSprite(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    frameIndex: number,
  ) {
    const frame = this.runFrames[frameIndex % this.runFrames.length]
    if (this.isFrameReady(frame)) {
      ctx.drawImage(frame, x, y, w, h)
      return
    }
    // Cool-toned silhouette while frames are still loading (or missing).
    ctx.save()
    ctx.fillStyle = 'rgba(140, 200, 255, 0.22)'
    ctx.beginPath()
    const r = Math.min(w, h) * 0.25
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.fill()
    ctx.restore()
  }
}
