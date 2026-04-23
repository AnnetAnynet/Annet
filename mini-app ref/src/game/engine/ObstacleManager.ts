import type { BiomeVisual, Obstacle, ObstacleType } from './types'
import {
  OBSTACLE_MIN_GAP_S, OBSTACLE_MAX_GAP_S, OBSTACLE_FIRST_GAP_S,
  OBSTACLE_GROUND_WIDTH, OBSTACLE_GROUND_HEIGHT,
  OBSTACLE_AERIAL_WIDTH, OBSTACLE_AERIAL_HEIGHT,
  AERIAL_OBSTACLE_CHANCE, GROUND_Y_RATIO, BIOMES,
  BASE_SPEED, GRAVITY, JUMP_VELOCITY,
  OBSTACLE_SPRITE_PATHS, biomeVisualAt,
} from './constants'

export class ObstacleManager {
  obstacles: Obstacle[] = []
  private canvasW = 0
  private groundY = 0
  private spawnTimer = 0
  private nextSpawnGap = 0

  private sprites: Record<string, HTMLImageElement> = {}
  private spritesLoaded = false

  constructor() {
    this.loadSprites()
  }

  private loadSprites() {
    let total = 0
    let loaded = 0
    const onDone = () => {
      loaded++
      if (loaded === total) this.spritesLoaded = true
    }
    const visuals = Object.keys(OBSTACLE_SPRITE_PATHS) as BiomeVisual[]
    for (const visual of visuals) {
      const paths = OBSTACLE_SPRITE_PATHS[visual]
      if (!paths) continue

      for (let v = 0; v < paths.ground.length; v++) {
        total++
        const key = `${visual}_ground_${v}`
        const img = new Image()
        img.src = paths.ground[v]
        img.onload = onDone
        img.onerror = onDone
        this.sprites[key] = img
      }

      total++
      const aerialKey = `${visual}_aerial`
      const aerialImg = new Image()
      aerialImg.src = paths.aerial
      aerialImg.onload = onDone
      aerialImg.onerror = onDone
      this.sprites[aerialKey] = aerialImg
    }
  }

  resize(canvasW: number, canvasH: number) {
    this.canvasW = canvasW
    this.groundY = canvasH * GROUND_Y_RATIO
  }

  reset() {
    this.obstacles = []
    this.spawnTimer = 0
    this.nextSpawnGap = OBSTACLE_FIRST_GAP_S * BASE_SPEED * 60
  }

  private randomGap(speed: number): number {
    const minGap = OBSTACLE_MIN_GAP_S * speed * 60
    const maxGap = OBSTACLE_MAX_GAP_S * speed * 60
    const gap = minGap + Math.random() * (maxGap - minGap)
    return Math.max(gap, this.minSafeGap(speed))
  }

  private minSafeGap(speed: number): number {
    const speedRatio = speed / BASE_SPEED
    const gravityScale = 1 + (speedRatio - 1) * 0.5
    // GRAVITY and JUMP_VELOCITY are in px/frame@60fps units.
    // Air time in frames@60fps = 2 * |v0| / g  (symmetrical ballistic arc).
    // Convert to seconds and then to px at current scroll speed.
    const airFrames = (2 * Math.abs(JUMP_VELOCITY)) / (GRAVITY * gravityScale)
    const airSeconds = airFrames / 60
    // scroll speed is currentSpeed * 60 px/s (matching pxPerFrame = speed * dt * 60)
    const scrollPxPerSec = speed * 60
    return scrollPxPerSec * airSeconds + OBSTACLE_GROUND_WIDTH + 50
  }

  update(speed: number, dt: number, biomeIndex: number) {
    const pxPerFrame = speed * dt * 60

    for (const obs of this.obstacles) {
      obs.x -= pxPerFrame
    }

    this.obstacles = this.obstacles.filter(o => o.x + o.width > -50)

    this.spawnTimer += pxPerFrame
    if (this.spawnTimer >= this.nextSpawnGap) {
      this.spawnTimer = 0
      this.nextSpawnGap = this.randomGap(speed)
      this.spawn(biomeIndex)
    }
  }

  knockback(px: number) {
    for (const obs of this.obstacles) {
      obs.x += px
    }
  }

  private spawn(biomeIndex: number) {
    const isAerial: boolean = Math.random() < AERIAL_OBSTACLE_CHANCE
    const type: ObstacleType = isAerial ? 'aerial' : 'ground'

    let w: number, h: number, y: number

    if (type === 'ground') {
      w = OBSTACLE_GROUND_WIDTH + Math.random() * 15
      h = OBSTACLE_GROUND_HEIGHT + Math.random() * 20
      y = this.groundY - h
    } else {
      w = OBSTACLE_AERIAL_WIDTH + Math.random() * 10
      h = OBSTACLE_AERIAL_HEIGHT
      const isHighBand = Math.random() < 0.5
      if (isHighBand) {
        y = this.groundY - 90 - Math.random() * 15
      } else {
        y = this.groundY - 55 - Math.random() * 10
      }
    }

    const visual = biomeVisualAt(biomeIndex)
    const groundVariants = OBSTACLE_SPRITE_PATHS[visual]?.ground.length ?? 1
    const variant = type === 'ground' ? Math.floor(Math.random() * groundVariants) : 0

    this.obstacles.push({
      x: this.canvasW + 20,
      y, width: w, height: h,
      type, biomeIndex, passed: false,
      animPhase: Math.random() * Math.PI * 2,
      variant,
    })
  }

  render(ctx: CanvasRenderingContext2D, time: number) {
    for (const obs of this.obstacles) {
      this.drawObstacle(ctx, obs, obs.biomeIndex, time)
    }
  }

  private drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, biomeIndex: number, time: number) {
    const visual = biomeVisualAt(biomeIndex)
    const spriteKey = obs.type === 'ground'
      ? `${visual}_ground_${obs.variant}`
      : `${visual}_aerial`
    const sprite = this.sprites[spriteKey]

    if (obs.type === 'aerial') {
      this.drawAerial(ctx, obs, biomeIndex, visual, time, sprite)
      return
    }

    if (this.spritesLoaded && sprite?.complete && sprite.naturalWidth > 0) {
      ctx.save()
      if (visual === 'night') {
        ctx.shadowColor = '#8060c0'
        ctx.shadowBlur = 12
      }
      ctx.drawImage(sprite, obs.x, obs.y, obs.width, obs.height)
      ctx.restore()
      return
    }

    this.drawFallback(ctx, obs, biomeIndex, visual, time)
  }

  private drawAerial(
    ctx: CanvasRenderingContext2D,
    obs: Obstacle,
    biomeIndex: number,
    visual: BiomeVisual,
    time: number,
    sprite: HTMLImageElement | undefined,
  ) {
    const t = time + obs.animPhase

    const bobOffset = Math.sin(t * 3) * 6
    const flapScale = 1 + Math.sin(t * 8) * 0.15

    const cx = obs.x + obs.width / 2
    const cy = obs.y + obs.height / 2 + bobOffset

    ctx.save()

    if (visual === 'night') {
      ctx.shadowColor = '#8060c0'
      ctx.shadowBlur = 12
    }
    if (visual === 'city') {
      ctx.shadowColor = 'rgba(40,45,60,0.4)'
      ctx.shadowBlur = 8
    }

    ctx.translate(cx, cy)
    ctx.scale(1, flapScale)

    if (this.spritesLoaded && sprite?.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, -obs.width / 2, -obs.height / 2, obs.width, obs.height)
    } else {
      ctx.translate(-cx, -cy)
      this.drawFallback(ctx, obs, biomeIndex, visual, time)
      ctx.restore()
      return
    }

    ctx.restore()
  }

  private drawFallback(ctx: CanvasRenderingContext2D, obs: Obstacle, biomeIndex: number, visual: BiomeVisual, time: number) {
    const colors = BIOMES[biomeIndex].obstacleColors
    const baseColor = colors[0]
    const accentColor = colors[1] || colors[0]
    const darkColor = colors[2] || colors[0]

    ctx.save()

    if (visual === 'night') {
      ctx.shadowColor = '#8060c0'
      ctx.shadowBlur = 12
    }

    if (visual === 'lava') {
      ctx.shadowColor = '#ff4400'
      ctx.shadowBlur = 14
    }

    if (visual === 'city') {
      ctx.shadowColor = 'rgba(60,70,90,0.5)'
      ctx.shadowBlur = 6
    }

    if (visual === 'desert') {
      this.drawCactus(ctx, obs, baseColor, accentColor)
    } else if (visual === 'forest') {
      this.drawStump(ctx, obs, baseColor, darkColor)
    } else if (visual === 'ice') {
      this.drawIceBlock(ctx, obs, baseColor, accentColor)
    } else if (visual === 'lava') {
      this.drawLavaRock(ctx, obs, baseColor, accentColor)
    } else if (visual === 'city') {
      if (obs.type === 'aerial') {
        const bob = Math.sin((time + obs.animPhase) * 3) * 6
        this.drawCityPigeon(ctx, obs, time, bob)
      } else if (obs.variant % 3 === 1) {
        this.drawCityTrashCan(ctx, obs, baseColor, accentColor, darkColor)
      } else {
        this.drawCityBollard(ctx, obs, accentColor, darkColor)
      }
    } else {
      this.drawGhostRock(ctx, obs, baseColor, accentColor)
    }

    ctx.restore()
  }

  private drawCityPigeon(ctx: CanvasRenderingContext2D, obs: Obstacle, time: number, bobY: number) {
    const cx = obs.x + obs.width / 2
    const cy = obs.y + obs.height / 2 + bobY
    const rx = obs.width * 0.38
    const ry = obs.height * 0.28
    const flap = Math.sin(time * 16 + obs.animPhase) * 4

    ctx.save()
    ctx.translate(cx, cy)

    ctx.fillStyle = '#4b5563'
    ctx.beginPath()
    ctx.ellipse(2, 2, rx * 0.85, ry, 0.08, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#6b7280'
    ctx.beginPath()
    ctx.ellipse(-rx * 0.35, -ry * 0.2, rx * 0.55 + flap * 0.08, ry * 0.55, -0.35, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#9ca3af'
    ctx.beginPath()
    ctx.arc(-rx * 0.75, -ry * 0.15, ry * 0.55, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1f2937'
    ctx.beginPath()
    ctx.arc(-rx * 0.82, -ry * 0.22, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.moveTo(-rx * 1.05, -ry * 0.1)
    ctx.lineTo(-rx * 1.35, 0)
    ctx.lineTo(-rx * 1.05, ry * 0.15)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#374151'
    ctx.beginPath()
    ctx.ellipse(rx * 0.15, 3, rx * 0.35, ry * 0.35 - flap * 0.04, 0.25, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  private drawCityBollard(ctx: CanvasRenderingContext2D, obs: Obstacle, capColor: string, poleColor: string) {
    const x = obs.x
    const y = obs.y
    const w = obs.width
    const h = obs.height
    const poleW = w * 0.38
    const px = x + (w - poleW) / 2

    ctx.fillStyle = poleColor
    ctx.fillRect(px, y + h * 0.22, poleW, h * 0.78)

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(px - 1, y + h * 0.18, poleW + 2, h * 0.08)

    ctx.fillStyle = capColor
    ctx.beginPath()
    ctx.roundRect(px - w * 0.06, y, poleW + w * 0.12, h * 0.22, 3)
    ctx.fill()

    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 1
    ctx.strokeRect(px, y + h * 0.22, poleW, h * 0.78)
  }

  /** Street wheelie bin / public garbage can (fallback when sprite missing). */
  private drawCityTrashCan(ctx: CanvasRenderingContext2D, obs: Obstacle, body: string, lidBand: string, dark: string) {
    const x = obs.x
    const y = obs.y
    const w = obs.width
    const h = obs.height
    const cx = x + w / 2
    const bodyTop = y + h * 0.22
    const bodyH = h * 0.72

    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(cx, y + h - 3, w * 0.4, h * 0.05, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = body
    ctx.fillRect(x + w * 0.12, bodyTop, w * 0.76, bodyH)

    ctx.strokeStyle = dark
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.35
    for (let i = 1; i <= 3; i++) {
      const vx = x + w * 0.12 + (w * 0.76 * i) / 4
      ctx.beginPath()
      ctx.moveTo(vx, bodyTop + 4)
      ctx.lineTo(vx, bodyTop + bodyH - 4)
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    ctx.fillStyle = lidBand
    ctx.fillRect(x + w * 0.08, y + h * 0.12, w * 0.84, h * 0.12)

    ctx.fillStyle = dark
    ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.04)

    ctx.fillStyle = '#1a1a1a'
    ctx.beginPath()
    ctx.ellipse(cx, y + h * 0.12, w * 0.28, h * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(x + w * 0.18, y + h * 0.88, w * 0.1, h * 0.08)
    ctx.fillRect(x + w * 0.72, y + h * 0.88, w * 0.1, h * 0.08)
  }

  private drawCactus(ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, accent: string) {
    if (obs.type === 'aerial') {
      ctx.fillStyle = color
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height)
      ctx.fillStyle = accent
      for (let i = 0; i < 3; i++) {
        const sx = obs.x + 8 + i * 16
        ctx.fillRect(sx, obs.y + obs.height - 8, 3, 8)
      }
      return
    }
    ctx.fillStyle = color
    const trunkW = obs.width * 0.35
    const trunkX = obs.x + (obs.width - trunkW) / 2
    ctx.fillRect(trunkX, obs.y, trunkW, obs.height)

    ctx.fillStyle = accent
    const armW = obs.width * 0.25
    const armH = obs.height * 0.3
    ctx.fillRect(obs.x, obs.y + obs.height * 0.25, armW, armH)
    ctx.fillRect(obs.x, obs.y + obs.height * 0.25, armW, obs.height * 0.15)
    ctx.fillRect(obs.x + obs.width - armW, obs.y + obs.height * 0.4, armW, armH)
    ctx.fillRect(obs.x + obs.width - armW, obs.y + obs.height * 0.4, armW, obs.height * 0.15)
  }

  private drawStump(ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, dark: string) {
    if (obs.type === 'aerial') {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = dark
      ctx.beginPath()
      ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 3, obs.height / 3, 0, 0, Math.PI * 2)
      ctx.fill()
      return
    }
    ctx.fillStyle = color
    ctx.fillRect(obs.x, obs.y + obs.height * 0.15, obs.width, obs.height * 0.85)
    ctx.fillStyle = dark
    ctx.beginPath()
    ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height * 0.15, obs.width / 2, obs.height * 0.15, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = dark
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      const rx = obs.x + 4 + i * (obs.width / 3)
      ctx.beginPath()
      ctx.arc(rx + 4, obs.y + obs.height * 0.5 + i * 5, 3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  private drawIceBlock(ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, accent: string) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(obs.x + 4, obs.y + obs.height)
    ctx.lineTo(obs.x, obs.y + obs.height * 0.3)
    ctx.lineTo(obs.x + obs.width * 0.3, obs.y)
    ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.1)
    ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.25)
    ctx.lineTo(obs.x + obs.width - 4, obs.y + obs.height)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = accent
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.moveTo(obs.x + obs.width * 0.2, obs.y + obs.height * 0.3)
    ctx.lineTo(obs.x + obs.width * 0.4, obs.y + obs.height * 0.15)
    ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.globalAlpha = 1
  }

  private drawLavaRock(ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, accent: string) {
    if (obs.type === 'aerial') {
      // Aerial: glowing lava chunk
      ctx.fillStyle = '#1a0800'
      ctx.beginPath()
      ctx.moveTo(obs.x + obs.width * 0.1, obs.y + obs.height)
      ctx.lineTo(obs.x, obs.y + obs.height * 0.5)
      ctx.lineTo(obs.x + obs.width * 0.25, obs.y)
      ctx.lineTo(obs.x + obs.width * 0.75, obs.y + obs.height * 0.1)
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.4)
      ctx.lineTo(obs.x + obs.width * 0.9, obs.y + obs.height)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = accent
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(obs.x + obs.width * 0.5, obs.y + obs.height * 0.45, obs.width * 0.18, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      return
    }

    // Ground: jagged volcanic rock with glowing lava cracks
    ctx.fillStyle = '#1e0a02'
    ctx.beginPath()
    ctx.moveTo(obs.x, obs.y + obs.height)
    ctx.lineTo(obs.x, obs.y + obs.height * 0.55)
    ctx.lineTo(obs.x + obs.width * 0.15, obs.y + obs.height * 0.2)
    ctx.lineTo(obs.x + obs.width * 0.35, obs.y)
    ctx.lineTo(obs.x + obs.width * 0.6, obs.y + obs.height * 0.1)
    ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height * 0.3)
    ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.5)
    ctx.lineTo(obs.x + obs.width, obs.y + obs.height)
    ctx.closePath()
    ctx.fill()

    // Lava crack lines
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.moveTo(obs.x + obs.width * 0.3, obs.y + obs.height * 0.5)
    ctx.lineTo(obs.x + obs.width * 0.45, obs.y + obs.height * 0.8)
    ctx.lineTo(obs.x + obs.width * 0.6, obs.y + obs.height * 0.55)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(obs.x + obs.width * 0.5, obs.y + obs.height * 0.3)
    ctx.lineTo(obs.x + obs.width * 0.7, obs.y + obs.height * 0.5)
    ctx.stroke()

    // Hot glow at top crack
    ctx.fillStyle = accent
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(obs.x + obs.width * 0.4, obs.y + obs.height * 0.25, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  private drawGhostRock(ctx: CanvasRenderingContext2D, obs: Obstacle, color: string, accent: string) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(obs.x, obs.y + obs.height)
    ctx.quadraticCurveTo(obs.x - 3, obs.y + obs.height * 0.3, obs.x + obs.width / 2, obs.y)
    ctx.quadraticCurveTo(obs.x + obs.width + 3, obs.y + obs.height * 0.3, obs.x + obs.width, obs.y + obs.height)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = accent
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.arc(obs.x + obs.width * 0.35, obs.y + obs.height * 0.4, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(obs.x + obs.width * 0.65, obs.y + obs.height * 0.4, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }
}
