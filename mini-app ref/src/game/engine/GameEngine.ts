import type { GameStatus, GameStateSnapshot, OvertakeEvent } from './types'
import {
  BASE_SPEED, SPEED_MULTIPLIER, BIOME_DURATION_S,
  MAX_BIOMES, MAX_HEALTH, INVULNERABLE_DURATION_S,
  STUN_RECOVERY_S, KNOCKBACK_PX,
  SCREEN_SHAKE_DURATION_MS, SCREEN_SHAKE_INTENSITY,
  RED_FLASH_DURATION_MS, DUST_INTERVAL, GROUND_Y_RATIO,
} from './constants'
import { Fox } from './Fox'
import { ObstacleManager } from './ObstacleManager'
import { BiomeManager } from './BiomeManager'
import { Background } from './Background'
import { ParticleSystem } from './ParticleSystem'
import { InputHandler } from './InputHandler'
import { GhostManager } from './GhostManager'
import { CollectibleManager } from './CollectibleManager'
import { aabbIntersect } from './Collision'
import type { Rival } from '../rivals'

const OVERTAKE_SHAKE_MS = 120

export class GameEngine {
  status: GameStatus = 'idle'
  health = MAX_HEALTH
  distance = 0
  time = 0

  currentSpeed = BASE_SPEED
  targetSpeed = BASE_SPEED

  fox: Fox
  obstacles: ObstacleManager
  biome: BiomeManager
  background: Background
  particles: ParticleSystem
  input: InputHandler
  ghosts: GhostManager
  collectibles: CollectibleManager

  coinsCollected = 0

  onStateChange: ((state: GameStateSnapshot) => void) | null = null
  onOvertake: ((event: OvertakeEvent) => void) | null = null

  private ctx: CanvasRenderingContext2D
  private animFrameId = 0
  private lastTimestamp = 0

  private isInvulnerable = false
  private invulnerableTimer = 0
  private blinkOn = true
  private blinkTimer = 0

  private isRecovering = false
  private recoveryTimer = 0
  private recoveryBaseSpeed = BASE_SPEED

  private shakeTimer = 0
  private shakeOffsetX = 0
  private shakeOffsetY = 0

  private redFlashTimer = 0
  private dustTimer = 0
  private ambientTimer = 0

  private speedIncreaseCount = 0

  private canvasW = 0
  private canvasH = 0

  private lastEmitMs = 0
  private lastEmittedStatus: GameStatus = 'idle'
  private static readonly HUD_EMIT_INTERVAL_MS = 50

  /** Visual time for background/obstacles while idle (game `time` stays 0). */
  private idleAnimTime = 0

  private static readonly IDLE_BG_SPEED_RATIO = 0.25

  private godMode = false

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
    this.fox = new Fox()
    this.obstacles = new ObstacleManager()
    this.biome = new BiomeManager()
    this.background = new Background()
    this.particles = new ParticleSystem()
    this.input = new InputHandler(canvas)
    this.ghosts = new GhostManager()
    this.ghosts.onOvertake = (event) => this.handleOvertake(event)
    this.collectibles = new CollectibleManager()
  }

  /** Apply the player's active skin to the fox. Pass null for the default skin. */
  setActiveSkin(key: string | null) {
    this.fox.setActiveSkin(key)
  }

  /** Feed the rivals pool for the current run. Call before / at start. */
  setRivals(rivals: Rival[]) {
    this.ghosts.setRivals(rivals)
    this.emitState(true)
  }

  /** Biome playthrough order for this run (indices into `BIOMES[]`). Desert should stay first. */
  setBiomeOrder(order: number[]) {
    this.biome.setBiomeOrder(order)
    this.emitState(true)
  }

  /** Admin: collisions do not reduce health or trigger hit effects; obstacles are cleared as passed. */
  setGodMode(enabled: boolean) {
    this.godMode = enabled
    this.emitState(true)
  }

  resize(w: number, h: number) {
    this.canvasW = w
    this.canvasH = h
    this.fox.resize(w, h)
    this.obstacles.resize(w, h)
    this.background.resize(w, h)
    this.ghosts.resize(w, h)
    this.collectibles.resize(w, h)
  }

  beginIdle() {
    this.stop()
    this.status = 'idle'
    this.health = MAX_HEALTH
    this.distance = 0
    this.time = 0
    this.idleAnimTime = 0
    this.currentSpeed = BASE_SPEED
    this.targetSpeed = BASE_SPEED
    this.speedIncreaseCount = 0
    this.isInvulnerable = false
    this.invulnerableTimer = 0
    this.isRecovering = false
    this.recoveryTimer = 0
    this.shakeTimer = 0
    this.shakeOffsetX = 0
    this.shakeOffsetY = 0
    this.redFlashTimer = 0
    this.dustTimer = 0
    this.ambientTimer = 0

    this.fox.reset()
    this.obstacles.reset()
    this.biome.reset()
    this.particles.reset()
    this.ghosts.reset()
    this.collectibles.reset()
    this.coinsCollected = 0

    this.lastTimestamp = 0
    this.lastEmitMs = 0
    this.lastEmittedStatus = 'idle'
    this.emitState(true)
    this.animFrameId = requestAnimationFrame((t) => this.idleLoop(t))
  }

  start() {
    this.stop()
    this.status = 'playing'
    this.health = MAX_HEALTH
    this.distance = 0
    this.time = 0
    this.currentSpeed = BASE_SPEED
    this.targetSpeed = BASE_SPEED
    this.speedIncreaseCount = 0
    this.isInvulnerable = false
    this.invulnerableTimer = 0
    this.isRecovering = false
    this.recoveryTimer = 0
    this.shakeTimer = 0
    this.redFlashTimer = 0
    this.dustTimer = 0
    this.ambientTimer = 0

    this.fox.reset()
    this.obstacles.reset()
    this.biome.reset()
    this.particles.reset()
    this.ghosts.reset()
    this.collectibles.reset()
    this.coinsCollected = 0

    this.lastTimestamp = 0
    this.lastEmitMs = 0
    this.lastEmittedStatus = 'idle'
    this.emitState(true)
    this.animFrameId = requestAnimationFrame((t) => this.loop(t))
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = 0
    }
  }

  destroy() {
    this.stop()
    this.input.destroy()
  }

  private idleLoop(timestamp: number) {
    if (this.status !== 'idle') return

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp
    const rawDt = (timestamp - this.lastTimestamp) / 1000
    const dt = Math.min(rawDt, 0.05)
    this.lastTimestamp = timestamp

    this.processIdleInput()
    this.biome.update(0, dt)
    this.fox.update(dt, 1)
    if (this.fox.justLanded) {
      this.fox.justLanded = false
      const groundY = this.canvasH * GROUND_Y_RATIO
      const fx = this.fox.state.x + this.fox.state.width * 0.5
      for (let i = 0; i < 6; i++) this.particles.emitDust(fx + (Math.random() - 0.5) * 20, groundY)
    }
    this.obstacles.update(0, dt, this.biome.spawnIndex)
    this.background.update(
      BASE_SPEED * GameEngine.IDLE_BG_SPEED_RATIO,
      dt,
      this.biome.spawnIndex,
    )
    this.particles.update(dt)
    this.emitAmbientParticles(dt)

    this.idleAnimTime += dt

    this.render()
    this.animFrameId = requestAnimationFrame((t) => this.idleLoop(t))
  }

  private processIdleInput() {
    const actions = this.input.flush()
    const speedRatio = 1
    for (const action of actions) {
      switch (action) {
        case 'jump':
          this.fox.jump()
          break
        case 'crouchStart':
          this.fox.crouchStart(speedRatio)
          break
        case 'crouchEnd':
          this.fox.crouchEnd()
          break
      }
    }
  }

  private loop(timestamp: number) {
    if (this.status !== 'playing') return

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp
    const rawDt = (timestamp - this.lastTimestamp) / 1000
    const dt = Math.min(rawDt, 0.05)
    this.lastTimestamp = timestamp

    this.processInput()
    this.updateTimers(dt)
    this.updateSpeed(dt)
    this.biome.update(this.time, dt)
    this.fox.update(dt, this.currentSpeed / BASE_SPEED)
    if (this.fox.justLanded) {
      this.fox.justLanded = false
      const groundY = this.canvasH * GROUND_Y_RATIO
      const fx = this.fox.state.x + this.fox.state.width * 0.5
      for (let i = 0; i < 6; i++) this.particles.emitDust(fx + (Math.random() - 0.5) * 20, groundY)
    }
    this.obstacles.update(this.currentSpeed, dt, this.biome.spawnIndex)
    this.background.update(this.currentSpeed, dt, this.biome.spawnIndex)
    this.collectibles.update(this.currentSpeed, dt, this.obstacles.obstacles)
    this.particles.update(dt)
    this.checkCollisions()
    this.collectCoins()
    this.emitAmbientParticles(dt)

    this.distance += this.currentSpeed * dt * 10
    this.time += dt

    this.ghosts.update(this.currentSpeed, dt, this.distance)

    this.render()
    this.emitState()

    this.animFrameId = requestAnimationFrame((t) => this.loop(t))
  }

  private processInput() {
    const actions = this.input.flush()
    const speedRatio = this.currentSpeed / BASE_SPEED
    for (const action of actions) {
      switch (action) {
        case 'jump':
          this.fox.jump()
          break
        case 'crouchStart':
          this.fox.crouchStart(speedRatio)
          break
        case 'crouchEnd':
          this.fox.crouchEnd()
          break
      }
    }
  }

  private updateTimers(dt: number) {
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt
      this.blinkTimer += dt
      if (this.blinkTimer >= 0.1) {
        this.blinkTimer = 0
        this.blinkOn = !this.blinkOn
      }
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false
        this.blinkOn = true
        if (this.fox.state.animation === 'hurt') {
          this.fox.setAnimation(this.fox.state.isOnGround ? 'run' : 'jump')
        }
      }
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt * 1000
      this.shakeOffsetX = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY
      this.shakeOffsetY = (Math.random() - 0.5) * SCREEN_SHAKE_INTENSITY
      if (this.shakeTimer <= 0) {
        this.shakeOffsetX = 0
        this.shakeOffsetY = 0
      }
    }

    if (this.redFlashTimer > 0) {
      this.redFlashTimer -= dt * 1000
    }
  }

  private updateSpeed(dt: number) {
    const expectedIncreases = Math.min(
      Math.floor(this.time / BIOME_DURATION_S),
      MAX_BIOMES - 1,
    )

    while (this.speedIncreaseCount < expectedIncreases) {
      this.speedIncreaseCount++
      this.targetSpeed *= SPEED_MULTIPLIER
    }

    if (this.isRecovering) {
      this.recoveryTimer += dt
      const t = Math.min(this.recoveryTimer / STUN_RECOVERY_S, 1)
      this.currentSpeed = this.recoveryBaseSpeed + (this.targetSpeed - this.recoveryBaseSpeed) * t
      if (t >= 1) {
        this.isRecovering = false
        this.currentSpeed = this.targetSpeed
      }
    } else {
      this.currentSpeed = this.targetSpeed
    }
  }

  private checkCollisions() {
    if (this.isInvulnerable) return

    const foxRect = this.fox.getHitbox()

    for (const obs of this.obstacles.obstacles) {
      if (obs.passed) continue

      const obsRect = {
        x: obs.x + 4,
        y: obs.y + 4,
        width: obs.width - 8,
        height: obs.height - 8,
      }

      if (aabbIntersect(foxRect, obsRect)) {
        if (this.godMode) {
          obs.passed = true
          break
        }
        this.onHit()
        obs.passed = true
        break
      }
    }
  }

  private collectCoins() {
    if (this.status !== 'playing') return
    const foxRect = this.fox.getHitbox()
    const picked = this.collectibles.collectColliding(foxRect)
    if (picked > 0) {
      this.coinsCollected += picked
      const cx = this.fox.state.x + this.fox.state.width * 0.5
      const cy = this.fox.state.y + this.fox.state.height * 0.4
      for (let i = 0; i < 6; i++) {
        this.particles.emitDust(cx + (Math.random() - 0.5) * 20, cy)
      }
      this.emitState(true)
    }
  }

  private onHit() {
    this.health--
    this.isInvulnerable = true
    this.invulnerableTimer = INVULNERABLE_DURATION_S
    this.blinkOn = true
    this.blinkTimer = 0

    this.fox.setAnimation('hurt', true)

    this.obstacles.knockback(KNOCKBACK_PX)
    this.collectibles.knockback(KNOCKBACK_PX)

    this.recoveryBaseSpeed = BASE_SPEED
    this.currentSpeed = BASE_SPEED
    this.isRecovering = true
    this.recoveryTimer = 0

    this.shakeTimer = SCREEN_SHAKE_DURATION_MS
    this.redFlashTimer = RED_FLASH_DURATION_MS

    this.particles.emitHit(
      this.fox.state.x + this.fox.state.width / 2,
      this.fox.state.y + this.fox.state.height / 2,
    )

    if (this.health <= 0) {
      this.status = 'gameOver'
      this.emitState()
    }
  }

  private emitAmbientParticles(dt: number) {
    if (this.fox.state.isOnGround && !this.fox.state.isCrouching) {
      this.dustTimer += dt
      if (this.dustTimer >= DUST_INTERVAL) {
        this.dustTimer = 0
        const groundY = this.canvasH * GROUND_Y_RATIO
        this.particles.emitDust(
          this.fox.state.x + this.fox.state.width * 0.3,
          groundY,
        )
      }
    }

    this.ambientTimer += dt
    const v = this.biome.current.visual
    if (v === 'ice' && this.ambientTimer > 0.15) {
      this.ambientTimer = 0
      this.particles.emitSnow(this.canvasW)
    } else if (v === 'night' && this.ambientTimer > 0.4) {
      this.ambientTimer = 0
      this.particles.emitFirefly(this.canvasW, this.canvasH * GROUND_Y_RATIO)
    }
  }

  private render() {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.canvasW, this.canvasH)

    const visualTime = this.status === 'idle' ? this.idleAnimTime : this.time

    ctx.save()
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY)

    this.background.render(ctx, this.biome, visualTime)

    if (this.status === 'playing') {
      this.ghosts.render(ctx, visualTime, this.distance)
    }

    this.obstacles.render(ctx, visualTime)

    this.collectibles.render(ctx, visualTime)

    const foxAlpha = this.isInvulnerable ? (this.blinkOn ? 1 : 0.2) : 1
    this.fox.render(ctx, foxAlpha, this.currentSpeed / BASE_SPEED)

    this.particles.render(ctx)

    if (this.redFlashTimer > 0) {
      const flashAlpha = (this.redFlashTimer / RED_FLASH_DURATION_MS) * 0.25
      ctx.fillStyle = `rgba(231,76,60,${flashAlpha})`
      ctx.fillRect(-20, -20, this.canvasW + 40, this.canvasH + 40)
    }

    ctx.restore()
  }

  private emitState(force = false) {
    if (!this.onStateChange) return
    const nowMs = performance.now()
    const statusChanged = this.status !== this.lastEmittedStatus
    if (!force && !statusChanged && (nowMs - this.lastEmitMs) < GameEngine.HUD_EMIT_INTERVAL_MS) return
    this.lastEmitMs = nowMs
    this.lastEmittedStatus = this.status
    this.onStateChange({
      health: this.health,
      distance: Math.floor(this.distance),
      time: this.time,
      biomeIndex: this.biome.currentIndex,
      status: this.status,
      biomeName: this.biome.current.name,
      incomingBiomeName:
        this.biome.transitioning && this.biome.next ? this.biome.next.name : null,
      godMode: this.godMode,
      nextRival: this.ghosts.getNextRival(this.distance),
      coinsCollected: this.coinsCollected,
    })
  }

  private handleOvertake(event: OvertakeEvent) {
    const foxCx = this.fox.state.x + this.fox.state.width * 0.5
    const groundY = this.canvasH * GROUND_Y_RATIO
    for (let i = 0; i < 10; i++) {
      this.particles.emitDust(foxCx + (Math.random() - 0.5) * 40, groundY)
    }
    if (this.shakeTimer < OVERTAKE_SHAKE_MS) {
      this.shakeTimer = OVERTAKE_SHAKE_MS
    }
    this.onOvertake?.(event)
    this.emitState(true)
  }
}
