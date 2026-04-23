import type { FoxState, FoxAnimation, Rect } from './types'
import {
  GRAVITY, JUMP_VELOCITY, FAST_FALL_VELOCITY,
  FOX_WIDTH, FOX_HEIGHT, FOX_CROUCH_WIDTH, FOX_CROUCH_HEIGHT, FOX_X_RATIO,
  FOX_ANIMATIONS, GROUND_Y_RATIO,
  SPY_FOX_ANIMATIONS, SPY_HOOD_OVERLAY_PATH,
  SKINS, getSkin, DEFAULT_SKIN_KEY,
} from './constants'
import type { SkinDef, SkinSpriteSet } from './constants'

const LAND_DURATION_S = 0.12
const TRAIL_SPEED_THRESHOLD = 1.5
const TRAIL_COUNT = 3
const TRAIL_SPACING_PX = 14

/** Fire ember trail tuning - small, cheap particles that ride behind the fox. */
const EMBER_EMIT_INTERVAL_S = 0.04
const EMBER_MAX = 48
const EMBER_LIFE_S = 0.55

interface TrailSnapshot {
  x: number
  y: number
  key: string
}

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
}

export class Fox {
  state: FoxState
  justLanded = false

  private spriteSets: Record<SkinSpriteSet, Record<string, HTMLImageElement>> = {
    default: {},
    spy: {},
  }
  private hoodSprite: HTMLImageElement
  private hoodReady = false
  private activeSkin: SkinDef = SKINS[0]
  private canvasW = 0
  private groundY = 0
  private landTimer = 0
  private trail: TrailSnapshot[] = []
  private embers: Ember[] = []
  private emberTimer = 0

  constructor() {
    this.state = this.defaultState()
    this.loadSprites()
    this.hoodSprite = new Image()
    this.hoodSprite.onload = () => { this.hoodReady = true }
    this.hoodSprite.onerror = () => { this.hoodReady = false }
    this.hoodSprite.src = SPY_HOOD_OVERLAY_PATH
  }

  setActiveSkin(key: string | null) {
    this.activeSkin = getSkin(key)
  }

  private defaultState(): FoxState {
    return {
      x: 0, y: 0,
      velocityY: 0,
      width: FOX_WIDTH, height: FOX_HEIGHT,
      isOnGround: true, isJumping: false, isCrouching: false,
      animation: 'run', animationFrame: 0, animationTimer: 0,
    }
  }

  private loadSprites() {
    for (const cfg of Object.values(FOX_ANIMATIONS)) {
      for (let i = 0; i < cfg.frames.length; i++) {
        const img = new Image()
        img.src = cfg.paths[i]
        this.spriteSets.default[cfg.frames[i]] = img
      }
    }
    for (const cfg of Object.values(SPY_FOX_ANIMATIONS)) {
      for (let i = 0; i < cfg.frames.length; i++) {
        const img = new Image()
        img.src = cfg.paths[i]
        this.spriteSets.spy[cfg.frames[i]] = img
      }
    }
  }

  private isSpriteReady(sprite: HTMLImageElement | undefined): sprite is HTMLImageElement {
    return !!sprite && sprite.complete && sprite.naturalWidth > 0
  }

  private getFrameSprite(key: string): HTMLImageElement | undefined {
    const preferred = this.spriteSets[this.activeSkin.spriteSet]?.[key]
    if (this.isSpriteReady(preferred)) return preferred
    return this.spriteSets.default[key]
  }

  resize(canvasW: number, canvasH: number) {
    this.canvasW = canvasW
    this.groundY = canvasH * GROUND_Y_RATIO
    const baseX = canvasW * FOX_X_RATIO
    this.state.x = baseX + (FOX_WIDTH - this.state.width) / 2
    if (this.state.isOnGround) {
      this.state.y = this.groundY - this.state.height
    }
  }

  reset() {
    Object.assign(this.state, this.defaultState())
    this.state.x = this.canvasW * FOX_X_RATIO
    this.state.y = this.groundY - FOX_HEIGHT
    this.landTimer = 0
    this.justLanded = false
    this.trail.length = 0
    this.embers.length = 0
    this.emberTimer = 0
  }

  setAnimation(anim: FoxAnimation, force = false) {
    if (force || this.state.animation !== anim) {
      this.state.animation = anim
      this.state.animationFrame = 0
      this.state.animationTimer = 0
    }
  }

  jump() {
    if (!this.state.isOnGround) return
    if (this.state.isCrouching) {
      const oldW = this.state.width
      this.state.isCrouching = false
      this.state.width = FOX_WIDTH
      this.state.height = FOX_HEIGHT
      this.state.x += (oldW - FOX_WIDTH) / 2
      this.state.y = this.groundY - FOX_HEIGHT
    }
    this.state.velocityY = JUMP_VELOCITY
    this.state.isOnGround = false
    this.state.isJumping = true
    this.setAnimation('jump', true)
  }

  crouchStart(speedRatio: number) {
    if (!this.state.isOnGround) {
      this.state.velocityY = FAST_FALL_VELOCITY * Math.max(speedRatio, 1)
      this.state.isCrouching = true
      return
    }
    this.state.isCrouching = true
    const oldW = this.state.width
    const oldH = this.state.height
    this.state.width = FOX_CROUCH_WIDTH
    this.state.height = FOX_CROUCH_HEIGHT
    this.state.x += (oldW - FOX_CROUCH_WIDTH) / 2
    this.state.y += (oldH - FOX_CROUCH_HEIGHT)
    this.setAnimation('crouch', true)
  }

  crouchEnd() {
    if (!this.state.isCrouching) return
    this.state.isCrouching = false
    if (this.state.isOnGround) {
      const oldW = this.state.width
      this.state.width = FOX_WIDTH
      this.state.height = FOX_HEIGHT
      this.state.x += (oldW - FOX_WIDTH) / 2
      this.state.y = this.groundY - FOX_HEIGHT
      this.setAnimation('run')
    }
  }

  update(dt: number, speedRatio: number) {
    this.justLanded = false
    const gravityScale = 1 + (speedRatio - 1) * 0.5
    const step = dt * 60

    if (!this.state.isOnGround) {
      this.state.velocityY += GRAVITY * gravityScale * step
      this.state.y += this.state.velocityY * step

      const landY = this.groundY - this.state.height
      if (this.state.y >= landY) {
        this.state.y = landY
        this.state.velocityY = 0
        this.state.isOnGround = true
        this.state.isJumping = false
        this.justLanded = true

        if (this.state.isCrouching) {
          const oldW = this.state.width
          this.state.width = FOX_CROUCH_WIDTH
          this.state.height = FOX_CROUCH_HEIGHT
          this.state.x += (oldW - FOX_CROUCH_WIDTH) / 2
          this.state.y = this.groundY - FOX_CROUCH_HEIGHT
          this.setAnimation('crouch', true)
        } else {
          this.setAnimation('land', true)
          this.landTimer = LAND_DURATION_S
        }
      }

      if (this.state.animation === 'jump') {
        const frames = FOX_ANIMATIONS.jump.frames
        if (this.state.velocityY < -4) {
          this.state.animationFrame = 0
        } else if (this.state.velocityY < 4) {
          this.state.animationFrame = Math.min(1, frames.length - 1)
        } else {
          this.state.animationFrame = Math.min(2, frames.length - 1)
        }
      }
    }

    if (this.state.animation === 'land') {
      this.landTimer -= dt
      if (this.landTimer <= 0) {
        this.setAnimation('run')
      }
    }

    if (this.state.animation === 'run') {
      const cfg = FOX_ANIMATIONS.run
      this.state.animationTimer += dt
      const interval = cfg.frameDuration / Math.max(speedRatio, 1)
      if (this.state.animationTimer >= interval) {
        this.state.animationTimer = 0
        this.state.animationFrame = (this.state.animationFrame + 1) % cfg.frames.length
      }
    }

    if (this.state.animation === 'crouch') {
      const cfg = FOX_ANIMATIONS.crouch
      this.state.animationTimer += dt
      const interval = cfg.frameDuration / Math.max(speedRatio, 1)
      if (this.state.animationTimer >= interval) {
        this.state.animationTimer = 0
        this.state.animationFrame = (this.state.animationFrame + 1) % cfg.frames.length
      }
    }

    if (this.state.animation === 'hurt') {
      const cfg = FOX_ANIMATIONS.hurt
      this.state.animationTimer += dt
      if (this.state.animationTimer >= cfg.frameDuration) {
        this.state.animationTimer = 0
        this.state.animationFrame = (this.state.animationFrame + 1) % cfg.frames.length
      }
    }

    this.trail.unshift({ x: this.state.x, y: this.state.y, key: this.spriteKey() })
    if (this.trail.length > TRAIL_COUNT + 1) this.trail.length = TRAIL_COUNT + 1

    if (this.activeSkin.overlay === 'fire_trail') {
      this.updateEmbers(dt)
    } else if (this.embers.length > 0) {
      this.embers.length = 0
    }
  }

  private updateEmbers(dt: number) {
    this.emberTimer += dt
    while (this.emberTimer >= EMBER_EMIT_INTERVAL_S && this.embers.length < EMBER_MAX) {
      this.emberTimer -= EMBER_EMIT_INTERVAL_S
      const tailX = this.state.x + 2
      const tailY = this.state.y + this.state.height * 0.45 + (Math.random() - 0.5) * 10
      this.embers.push({
        x: tailX,
        y: tailY,
        vx: -40 - Math.random() * 50,
        vy: -10 - Math.random() * 25,
        life: EMBER_LIFE_S,
        size: 2 + Math.random() * 2.5,
      })
    }

    for (const e of this.embers) {
      e.x += e.vx * dt
      e.y += e.vy * dt
      e.vy += 40 * dt
      e.life -= dt
    }
    this.embers = this.embers.filter((e) => e.life > 0)
  }

  private spriteKey(): string {
    const s = this.state
    const cfg = FOX_ANIMATIONS[s.animation]
    if (!cfg) return FOX_ANIMATIONS.run.frames[0]
    return cfg.frames[Math.min(s.animationFrame, cfg.frames.length - 1)]
  }

  getHitbox(): Rect {
    const shrink = 8
    return {
      x: this.state.x + shrink,
      y: this.state.y + shrink,
      width: this.state.width - shrink * 2,
      height: this.state.height - shrink * 2,
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, speedRatio = 1) {
    const s = this.state
    const key = this.spriteKey()
    const sprite = this.getFrameSprite(key)

    ctx.save()
    ctx.globalAlpha = alpha

    if (this.activeSkin.overlay === 'fire_trail') {
      this.renderEmbers(ctx, alpha)
    }

    if (speedRatio > TRAIL_SPEED_THRESHOLD && this.trail.length > 1) {
      for (let i = 1; i <= Math.min(TRAIL_COUNT, this.trail.length - 1); i++) {
        const t = this.trail[i]
        const ghost = this.getFrameSprite(t.key)
        if (this.isSpriteReady(ghost)) {
          ctx.globalAlpha = alpha * (0.18 - i * 0.05)
          ctx.drawImage(ghost, t.x - i * TRAIL_SPACING_PX, t.y, s.width, s.height)
        }
      }
      ctx.globalAlpha = alpha
    }

    const cx = s.x + s.width / 2
    const by = s.y + s.height

    ctx.save()
    ctx.translate(cx, by)

    if (s.animation === 'run' || s.animation === 'land') {
      const lean = Math.min((speedRatio - 1) * 0.04, 0.12)
      if (lean > 0.001) ctx.rotate(lean)
    }

    let sx = 1
    let sy = 1
    if (s.animation === 'land' && this.landTimer > 0) {
      const t = this.landTimer / LAND_DURATION_S
      sx = 1 + t * 0.25
      sy = 1 - t * 0.2
    }
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy)

    let bobY = 0
    if (s.animation === 'run') {
      bobY = Math.sin(s.animationTimer * 40 + s.animationFrame * Math.PI) * 1.5
    }

    const filter = this.activeSkin.filter
    const glow = this.activeSkin.glow
    if (filter) ctx.filter = filter
    if (glow) {
      ctx.shadowColor = glow
      ctx.shadowBlur = 14
    }

    if (this.isSpriteReady(sprite)) {
      ctx.drawImage(sprite, -s.width / 2, -s.height + bobY, s.width, s.height)
    } else {
      this.renderFallback(ctx, bobY)
    }

    if (filter) ctx.filter = 'none'
    if (glow) {
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }

    this.renderSkinOverlay(ctx, bobY)

    ctx.restore()
    ctx.restore()
  }

  private renderEmbers(ctx: CanvasRenderingContext2D, alpha: number) {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const e of this.embers) {
      const t = Math.max(0, e.life / EMBER_LIFE_S)
      ctx.globalAlpha = alpha * t * 0.9
      const r = e.size * (0.4 + t * 0.6)
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 3)
      grad.addColorStop(0, 'rgba(255,220,120,0.95)')
      grad.addColorStop(0.45, 'rgba(255,120,30,0.55)')
      grad.addColorStop(1, 'rgba(255,60,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(e.x, e.y, r * 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private renderSkinOverlay(ctx: CanvasRenderingContext2D, bobY: number) {
    if (this.activeSkin.overlay !== 'hood') return
    const s = this.state

    const width = 46
    const height = 34
    const x = -width / 2
    const y = -s.height - 6 + bobY

    if (this.hoodReady && this.isSpriteReady(this.hoodSprite)) {
      ctx.drawImage(this.hoodSprite, x, y, width, height)
      return
    }

    ctx.save()
    ctx.fillStyle = '#0d0f14'
    ctx.strokeStyle = '#2a2e38'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + 4, y + height)
    ctx.quadraticCurveTo(x + width / 2, y - 4, x + width - 4, y + height)
    ctx.lineTo(x + width - 10, y + height)
    ctx.quadraticCurveTo(x + width / 2, y + 10, x + 10, y + height)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  private renderFallback(ctx: CanvasRenderingContext2D, bobY: number) {
    const s = this.state
    const hw = s.width / 2

    ctx.fillStyle = this.activeSkin.swatch
    ctx.beginPath()
    ctx.roundRect(-hw, -s.height + bobY, s.width, s.height, 8)
    ctx.fill()

    ctx.fillStyle = '#ff8c2a'
    ctx.beginPath()
    ctx.moveTo(-hw + 10, -s.height + bobY)
    ctx.lineTo(-hw + 5, -s.height - 14 + bobY)
    ctx.lineTo(-hw + 18, -s.height + bobY)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(hw - 10, -s.height + bobY)
    ctx.lineTo(hw - 5, -s.height - 14 + bobY)
    ctx.lineTo(hw - 18, -s.height + bobY)
    ctx.fill()

    ctx.fillStyle = this.activeSkin.swatch
    ctx.beginPath()
    ctx.ellipse(hw + 12, -15 + bobY, 18, 10, -0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(hw - 14, -s.height + 18 + bobY, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

export { DEFAULT_SKIN_KEY }
