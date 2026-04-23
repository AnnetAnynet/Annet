import type { BackgroundElement, BiomeVisual } from './types'
import { BiomeManager } from './BiomeManager'
import { GROUND_Y_RATIO, biomeVisualAt } from './constants'

interface DecorationLayer {
  elements: BackgroundElement[]
  speedMultiplier: number
}

export class Background {
  private layers: DecorationLayer[] = []
  private canvasW = 0
  private canvasH = 0
  private groundY = 0
  private starPositions: { x: number; y: number; size: number; twinkle: number }[] = []

  resize(canvasW: number, canvasH: number) {
    this.canvasW = canvasW
    this.canvasH = canvasH
    this.groundY = canvasH * GROUND_Y_RATIO

    if (this.starPositions.length === 0) {
      for (let i = 0; i < 60; i++) {
        this.starPositions.push({
          x: Math.random() * canvasW,
          y: Math.random() * this.groundY * 0.7,
          size: Math.random() * 2 + 0.5,
          twinkle: Math.random() * Math.PI * 2,
        })
      }
    }

    this.initLayers()
  }

  private initLayers() {
    this.layers = [
      { elements: this.generateLayer(0.15, 6, 'far'), speedMultiplier: 0.2 },
      { elements: this.generateLayer(0.4, 8, 'mid'), speedMultiplier: 0.5 },
    ]
  }

  private generateLayer(yRatio: number, count: number, type: string): BackgroundElement[] {
    const out: BackgroundElement[] = []
    for (let i = 0; i < count; i++) {
      out.push({
        x: (this.canvasW / count) * i + Math.random() * 60,
        y: this.groundY * yRatio + Math.random() * this.groundY * 0.2,
        width: 50 + Math.random() * 60,
        height: 60 + Math.random() * 80,
        speed: 0,
        type,
        biomeIndex: 0,
      })
    }
    return out
  }

  update(speed: number, dt: number, spawnBiomeIndex: number) {
    for (const layer of this.layers) {
      for (const el of layer.elements) {
        el.x -= speed * layer.speedMultiplier * dt * 60
        if (el.x + el.width < 0) {
          el.x = this.canvasW + Math.random() * 100
          el.y = this.groundY * (layer.speedMultiplier < 0.3 ? 0.15 : 0.4) + Math.random() * this.groundY * 0.2
          el.biomeIndex = spawnBiomeIndex
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, biome: BiomeManager, time: number) {
    const w = this.canvasW
    const h = this.canvasH

    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY)
    grad.addColorStop(0, biome.getSkyTop())
    grad.addColorStop(1, biome.getSkyBottom())
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, this.groundY)

    const desertOp = this.atmosphericLayerOpacity('desert', biome)
    if (desertOp > 0) {
      ctx.save()
      ctx.globalAlpha = desertOp
      this.renderDesertSun(ctx, time)
      ctx.restore()
    }

    const mountainSunOp = this.atmosphericLayerOpacity('ice', biome)
    if (mountainSunOp > 0) {
      ctx.save()
      ctx.globalAlpha = mountainSunOp
      this.renderSun(ctx)
      ctx.restore()
    }

    const nightOp = this.atmosphericLayerOpacity('night', biome)
    if (nightOp > 0) {
      ctx.save()
      ctx.globalAlpha = nightOp
      this.renderStars(ctx, time)
      this.renderMoon(ctx)
      ctx.restore()
    }

    const lavaOp = this.atmosphericLayerOpacity('lava', biome)
    if (lavaOp > 0) {
      ctx.save()
      ctx.globalAlpha = lavaOp
      this.renderLavaAtmosphere(ctx, time)
      ctx.restore()
    }

    const cityOp = this.atmosphericLayerOpacity('city', biome)
    if (cityOp > 0) {
      ctx.save()
      ctx.globalAlpha = cityOp
      this.renderCityAtmosphere(ctx, time)
      ctx.restore()
    }

    this.renderDecorations(ctx, biome, time)

    ctx.fillStyle = biome.getGroundColor()
    ctx.fillRect(0, this.groundY, w, h - this.groundY)

    ctx.strokeStyle = biome.getGroundLine()
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    ctx.lineTo(w, this.groundY)
    ctx.stroke()

    this.renderGroundDetail(ctx, biome, time)
  }

  private renderStars(ctx: CanvasRenderingContext2D, time: number) {
    for (const star of this.starPositions) {
      const alpha = 0.5 + Math.sin(time * 2 + star.twinkle) * 0.4
      ctx.fillStyle = `rgba(255,255,230,${alpha})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private renderDesertSun(ctx: CanvasRenderingContext2D, time: number) {
    const sx = this.canvasW * 0.78
    const sy = this.groundY * 0.14

    // Pulsating heat haze - outermost glow breathes with time
    const pulse = 0.5 + Math.sin(time * 1.8) * 0.15
    const outerGlow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 200)
    outerGlow.addColorStop(0, `rgba(255,200,50,${0.18 * pulse})`)
    outerGlow.addColorStop(0.5, `rgba(255,120,0,${0.08 * pulse})`)
    outerGlow.addColorStop(1, 'rgba(255,60,0,0)')
    ctx.fillStyle = outerGlow
    ctx.beginPath()
    ctx.arc(sx, sy, 200, 0, Math.PI * 2)
    ctx.fill()

    // Inner heat corona
    const corona = ctx.createRadialGradient(sx, sy, 0, sx, sy, 55)
    corona.addColorStop(0, 'rgba(255,240,150,0.6)')
    corona.addColorStop(0.5, 'rgba(255,160,30,0.25)')
    corona.addColorStop(1, 'rgba(255,80,0,0)')
    ctx.fillStyle = corona
    ctx.beginPath()
    ctx.arc(sx, sy, 55, 0, Math.PI * 2)
    ctx.fill()

    // Sun disc - harsh white-yellow core
    const disc = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18)
    disc.addColorStop(0, 'rgba(255,255,230,1)')
    disc.addColorStop(0.6, 'rgba(255,220,80,0.95)')
    disc.addColorStop(1, 'rgba(255,160,20,0.7)')
    ctx.fillStyle = disc
    ctx.beginPath()
    ctx.arc(sx, sy, 18, 0, Math.PI * 2)
    ctx.fill()

    // Rays - 8 sharp spikes
    const rayCount = 8
    const rayLen = 36 + Math.sin(time * 3) * 5
    ctx.strokeStyle = 'rgba(255,230,100,0.5)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2
      const r0 = 20
      ctx.beginPath()
      ctx.moveTo(sx + Math.cos(angle) * r0, sy + Math.sin(angle) * r0)
      ctx.lineTo(sx + Math.cos(angle) * (r0 + rayLen), sy + Math.sin(angle) * (r0 + rayLen))
      ctx.stroke()
    }
  }

  private renderSun(ctx: CanvasRenderingContext2D) {
    const sx = this.canvasW * 0.72
    const sy = this.groundY * 0.28

    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 120)
    glow.addColorStop(0, 'rgba(255,220,100,0.25)')
    glow.addColorStop(0.4, 'rgba(255,160,60,0.12)')
    glow.addColorStop(1, 'rgba(255,100,30,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sx, sy, 120, 0, Math.PI * 2)
    ctx.fill()

    const inner = ctx.createRadialGradient(sx, sy, 0, sx, sy, 22)
    inner.addColorStop(0, 'rgba(255,240,180,0.9)')
    inner.addColorStop(1, 'rgba(255,180,60,0.4)')
    ctx.fillStyle = inner
    ctx.beginPath()
    ctx.arc(sx, sy, 22, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderMoon(ctx: CanvasRenderingContext2D) {
    const mx = this.canvasW * 0.8
    const my = this.groundY * 0.18
    ctx.fillStyle = 'rgba(255,250,220,0.9)'
    ctx.beginPath()
    ctx.arc(mx, my, 30, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,250,220,0.1)'
    ctx.beginPath()
    ctx.arc(mx, my, 50, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderDecorations(ctx: CanvasRenderingContext2D, biome: BiomeManager, time: number) {
    for (const layer of this.layers) {
      ctx.save()
      const cv = biome.current.visual
      ctx.globalAlpha = (cv === 'ice' || cv === 'lava' || cv === 'city') ? 0.72 : 0.3

      for (const el of layer.elements) {
        const v = biomeVisualAt(el.biomeIndex)
        if (v === 'desert') {
          this.drawDune(ctx, el)
        } else if (v === 'forest') {
          this.drawPine(ctx, el)
        } else if (v === 'ice') {
          this.drawMountain(ctx, el)
        } else if (v === 'lava') {
          this.drawVolcano(ctx, el, time)
        } else if (v === 'city') {
          this.drawSkyscraper(ctx, el, time)
        } else {
          this.drawGhostTree(ctx, el)
        }
      }

      ctx.restore()
    }
  }

  /** Full opacity when this visual is active; fades in/out during biome transitions. */
  private atmosphericLayerOpacity(visual: BiomeVisual, biome: BiomeManager): number {
    const cur = biome.current.visual
    const next = biome.next?.visual
    const t = biome.transition
    if (!biome.transitioning) {
      return cur === visual ? 1 : 0
    }
    if (cur === visual && next !== undefined && next !== visual) {
      return 1 - t
    }
    if (next === visual && cur !== visual) {
      return t
    }
    return cur === visual ? 1 : 0
  }

  private drawDune(ctx: CanvasRenderingContext2D, el: BackgroundElement) {
    ctx.fillStyle = '#8B7355'
    ctx.beginPath()
    ctx.moveTo(el.x, this.groundY)
    ctx.quadraticCurveTo(el.x + el.width / 2, this.groundY - el.height * 0.4, el.x + el.width, this.groundY)
    ctx.fill()
  }

  private drawPine(ctx: CanvasRenderingContext2D, el: BackgroundElement) {
    ctx.fillStyle = '#1a3a1a'
    ctx.beginPath()
    ctx.moveTo(el.x + el.width / 2, el.y)
    ctx.lineTo(el.x, this.groundY)
    ctx.lineTo(el.x + el.width, this.groundY)
    ctx.closePath()
    ctx.fill()
  }

  private drawMountain(ctx: CanvasRenderingContext2D, el: BackgroundElement) {
    const gY = this.groundY
    const isFar = el.y < gY * 0.3

    if (isFar) {
      // Distant range - blue-haze silhouette with two smaller sibling peaks
      const mH = el.height * 2.4
      const cx = el.x + el.width / 2

      // Left sibling
      ctx.fillStyle = '#2a3d58'
      ctx.beginPath()
      ctx.moveTo(cx - el.width * 0.7, gY)
      ctx.lineTo(cx - el.width * 0.15, gY - mH * 0.55)
      ctx.lineTo(cx + el.width * 0.3, gY)
      ctx.closePath()
      ctx.fill()

      // Right sibling
      ctx.fillStyle = '#2e4260'
      ctx.beginPath()
      ctx.moveTo(cx + el.width * 0.1, gY)
      ctx.lineTo(cx + el.width * 0.6, gY - mH * 0.48)
      ctx.lineTo(cx + el.width * 1.2, gY)
      ctx.closePath()
      ctx.fill()

      // Main peak - shadow side
      ctx.fillStyle = '#1e3050'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx - el.width * 0.55, gY)
      ctx.lineTo(cx, gY)
      ctx.closePath()
      ctx.fill()

      // Main peak - light side
      ctx.fillStyle = '#3a5878'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx, gY)
      ctx.lineTo(cx + el.width * 0.55, gY)
      ctx.closePath()
      ctx.fill()

      // Snow cap (far, subtle)
      ctx.fillStyle = 'rgba(180,210,240,0.55)'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx - el.width * 0.13, gY - mH * 0.78)
      ctx.lineTo(cx + el.width * 0.14, gY - mH * 0.78)
      ctx.closePath()
      ctx.fill()

    } else {
      // Close range - dramatic peaks with rich snow and ridge detail
      const mH = el.height * 3.0
      const cx = el.x + el.width / 2

      // Sub-peak left
      ctx.fillStyle = '#3a4a5a'
      ctx.beginPath()
      ctx.moveTo(cx - el.width * 0.55, gY)
      ctx.lineTo(cx - el.width * 0.1, gY - mH * 0.62)
      ctx.lineTo(cx + el.width * 0.3, gY)
      ctx.closePath()
      ctx.fill()

      // Sub-peak right
      ctx.fillStyle = '#404f60'
      ctx.beginPath()
      ctx.moveTo(cx + el.width * 0.05, gY)
      ctx.lineTo(cx + el.width * 0.55, gY - mH * 0.58)
      ctx.lineTo(cx + el.width * 1.1, gY)
      ctx.closePath()
      ctx.fill()

      // Main - shadow side (left face)
      ctx.fillStyle = '#2e3d50'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx - el.width * 0.6, gY)
      ctx.lineTo(cx, gY)
      ctx.closePath()
      ctx.fill()

      // Main - light side (right face, catches sun)
      ctx.fillStyle = '#5a7088'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx, gY)
      ctx.lineTo(cx + el.width * 0.6, gY)
      ctx.closePath()
      ctx.fill()

      // Ridge highlight - subtle rim light from sun
      ctx.strokeStyle = 'rgba(255,220,140,0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx + el.width * 0.6, gY)
      ctx.stroke()

      // Snow - shadow side (blue-white)
      ctx.fillStyle = 'rgba(160,195,230,0.75)'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx - el.width * 0.2, gY - mH * 0.72)
      ctx.lineTo(cx - el.width * 0.05, gY - mH * 0.62)
      ctx.lineTo(cx, gY - mH * 0.65)
      ctx.closePath()
      ctx.fill()

      // Snow - light side (warm white)
      ctx.fillStyle = 'rgba(230,245,255,0.88)'
      ctx.beginPath()
      ctx.moveTo(cx, gY - mH)
      ctx.lineTo(cx, gY - mH * 0.65)
      ctx.lineTo(cx + el.width * 0.06, gY - mH * 0.62)
      ctx.lineTo(cx + el.width * 0.2, gY - mH * 0.7)
      ctx.closePath()
      ctx.fill()

      // Scree / mid-snow streaks on light face
      ctx.fillStyle = 'rgba(200,225,245,0.3)'
      ctx.beginPath()
      ctx.moveTo(cx + el.width * 0.22, gY - mH * 0.68)
      ctx.lineTo(cx + el.width * 0.3, gY - mH * 0.55)
      ctx.lineTo(cx + el.width * 0.35, gY - mH * 0.58)
      ctx.lineTo(cx + el.width * 0.27, gY - mH * 0.7)
      ctx.closePath()
      ctx.fill()
    }
  }

  private renderLavaAtmosphere(ctx: CanvasRenderingContext2D, time: number) {
    // Red horizon glow that breathes with lava pulse
    const pulse = 0.12 + Math.sin(time * 0.9) * 0.04
    const horizonGlow = ctx.createLinearGradient(0, this.groundY * 0.4, 0, this.groundY)
    horizonGlow.addColorStop(0, 'rgba(180,0,0,0)')
    horizonGlow.addColorStop(0.6, `rgba(210,30,0,${pulse})`)
    horizonGlow.addColorStop(1, `rgba(255,80,0,${pulse * 2})`)
    ctx.fillStyle = horizonGlow
    ctx.fillRect(0, 0, this.canvasW, this.groundY)

    // Embers drifting upward
    for (let e = 0; e < 12; e++) {
      const seed = e * 137.508
      const ex = (seed * 7.3) % this.canvasW
      const cycleH = this.groundY * (0.5 + (e % 3) * 0.15)
      const ey = this.groundY - ((time * (28 + e * 4) + e * 55) % cycleH)
      const drift = Math.sin(time * 1.2 + e) * 8
      const emberAlpha = 0.3 + Math.sin(time * 4 + e * 1.7) * 0.25
      ctx.fillStyle = `rgba(255,${100 + (e % 5) * 20},0,${emberAlpha})`
      ctx.beginPath()
      ctx.arc(ex + drift, ey, 1.5 + (e % 3) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawVolcano(ctx: CanvasRenderingContext2D, el: BackgroundElement, time: number) {
    const gY = this.groundY
    const isFar = el.y < gY * 0.3
    const cx = el.x + el.width / 2

    if (isFar) {
      const vH = el.height * 2.2

      // Shadow face
      ctx.fillStyle = '#1a0802'
      ctx.beginPath()
      ctx.moveTo(cx, gY - vH)
      ctx.lineTo(cx - el.width * 0.5, gY)
      ctx.lineTo(cx, gY)
      ctx.closePath()
      ctx.fill()

      // Lava-lit face
      ctx.fillStyle = '#2a1005'
      ctx.beginPath()
      ctx.moveTo(cx, gY - vH)
      ctx.lineTo(cx, gY)
      ctx.lineTo(cx + el.width * 0.5, gY)
      ctx.closePath()
      ctx.fill()

      // Crater glow
      const craterAlpha = 0.75 + Math.sin(time * 3.5) * 0.2
      const craterGlow = ctx.createRadialGradient(cx, gY - vH, 0, cx, gY - vH, 18)
      craterGlow.addColorStop(0, `rgba(255,120,0,${craterAlpha})`)
      craterGlow.addColorStop(0.5, `rgba(200,40,0,${craterAlpha * 0.5})`)
      craterGlow.addColorStop(1, 'rgba(150,0,0,0)')
      ctx.fillStyle = craterGlow
      ctx.beginPath()
      ctx.arc(cx, gY - vH, 18, 0, Math.PI * 2)
      ctx.fill()

      // Single smoke column
      const smokeRise = (time * 22) % (vH * 0.7)
      const smokeAlpha = 0.28 * (1 - smokeRise / (vH * 0.7))
      ctx.fillStyle = `rgba(55,40,35,${smokeAlpha})`
      ctx.beginPath()
      ctx.arc(
        cx + Math.sin(time * 0.6) * 5,
        gY - vH - smokeRise,
        7 + smokeRise * 0.08,
        0, Math.PI * 2,
      )
      ctx.fill()

    } else {
      const vH = el.height * 3.2

      // Left shoulder
      ctx.fillStyle = '#150701'
      ctx.beginPath()
      ctx.moveTo(cx - el.width * 0.85, gY)
      ctx.lineTo(cx - el.width * 0.18, gY - vH * 0.48)
      ctx.lineTo(cx + el.width * 0.12, gY)
      ctx.closePath()
      ctx.fill()

      // Right shoulder
      ctx.fillStyle = '#1a0a02'
      ctx.beginPath()
      ctx.moveTo(cx + el.width * 0.08, gY)
      ctx.lineTo(cx + el.width * 0.48, gY - vH * 0.43)
      ctx.lineTo(cx + el.width * 0.95, gY)
      ctx.closePath()
      ctx.fill()

      // Main cone - shadow side
      ctx.fillStyle = '#120601'
      ctx.beginPath()
      ctx.moveTo(cx, gY - vH)
      ctx.lineTo(cx - el.width * 0.58, gY)
      ctx.lineTo(cx, gY)
      ctx.closePath()
      ctx.fill()

      // Main cone - lava-lit side
      ctx.fillStyle = '#261005'
      ctx.beginPath()
      ctx.moveTo(cx, gY - vH)
      ctx.lineTo(cx, gY)
      ctx.lineTo(cx + el.width * 0.58, gY)
      ctx.closePath()
      ctx.fill()

      // Lava streak running down right face
      const streakAlpha = 0.3 + Math.sin(time * 2) * 0.1
      ctx.strokeStyle = `rgba(230,70,0,${streakAlpha})`
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cx + el.width * 0.06, gY - vH * 0.93)
      ctx.quadraticCurveTo(cx + el.width * 0.22, gY - vH * 0.58, cx + el.width * 0.38, gY - vH * 0.25)
      ctx.stroke()

      // Crater rim
      ctx.fillStyle = '#3a1a05'
      ctx.beginPath()
      ctx.ellipse(cx, gY - vH, el.width * 0.18, el.width * 0.06, 0, 0, Math.PI * 2)
      ctx.fill()

      // Lava pool in crater - pulsing
      const lavaP = 0.7 + Math.sin(time * 4.2) * 0.2
      const lavaGrad = ctx.createRadialGradient(cx, gY - vH, 0, cx, gY - vH, el.width * 0.14)
      lavaGrad.addColorStop(0, `rgba(255,210,60,${lavaP})`)
      lavaGrad.addColorStop(0.5, `rgba(255,80,0,${lavaP * 0.85})`)
      lavaGrad.addColorStop(1, 'rgba(180,0,0,0)')
      ctx.fillStyle = lavaGrad
      ctx.beginPath()
      ctx.ellipse(cx, gY - vH, el.width * 0.14, el.width * 0.05, 0, 0, Math.PI * 2)
      ctx.fill()

      // Upward lava glow from crater
      const upGlow = ctx.createRadialGradient(cx, gY - vH, 0, cx, gY - vH, 60)
      upGlow.addColorStop(0, `rgba(255,100,0,${0.45 + Math.sin(time * 3) * 0.1})`)
      upGlow.addColorStop(0.5, 'rgba(200,40,0,0.18)')
      upGlow.addColorStop(1, 'rgba(150,0,0,0)')
      ctx.fillStyle = upGlow
      ctx.beginPath()
      ctx.arc(cx, gY - vH, 60, 0, Math.PI * 2)
      ctx.fill()

      // 3 smoke columns cycling at different phases
      const smokeCycleH = vH * 0.95
      for (let s = 0; s < 3; s++) {
        const phaseOffset = (s / 3) * smokeCycleH
        const smokeRise = ((time * 35 + phaseOffset) % smokeCycleH)
        const smokeX = cx + (s - 1) * el.width * 0.1
        const smokeAlpha = 0.32 * (1 - smokeRise / smokeCycleH)
        const smokeR = 9 + smokeRise * 0.1
        const drift = Math.sin(time * 0.7 + s * 1.3) * smokeRise * 0.12
        ctx.fillStyle = `rgba(50,38,32,${smokeAlpha})`
        ctx.beginPath()
        ctx.arc(smokeX + drift, gY - vH - smokeRise, smokeR, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  private renderCityAtmosphere(ctx: CanvasRenderingContext2D, time: number) {
    const haze = ctx.createLinearGradient(0, this.groundY * 0.2, 0, this.groundY * 0.95)
    haze.addColorStop(0, 'rgba(120,160,220,0)')
    haze.addColorStop(0.5, `rgba(90,110,150,${0.1 + Math.sin(time * 0.45) * 0.025})`)
    haze.addColorStop(1, 'rgba(45,55,75,0.22)')
    ctx.fillStyle = haze
    ctx.fillRect(0, 0, this.canvasW, this.groundY)

    const px = ((time * 38) % (this.canvasW + 100)) - 20
    const py = this.groundY * 0.1 + Math.sin(time * 0.65) * 5
    ctx.fillStyle = 'rgba(255,235,200,0.85)'
    ctx.beginPath()
    ctx.arc(px, py, 1.3, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawSkyscraper(ctx: CanvasRenderingContext2D, el: BackgroundElement, time: number) {
    const gY = this.groundY
    const isFar = el.y < gY * 0.28
    const left = el.x
    const bw = el.width

    if (isFar) {
      const h = el.height * 2.1
      const top = gY - h
      ctx.fillStyle = '#1a2233'
      ctx.fillRect(left, top, bw * 0.42, h)
      ctx.fillStyle = '#222a3c'
      ctx.fillRect(left + bw * 0.48, top + h * 0.1, bw * 0.38, h * 0.9)
      for (let i = 0; i < 5; i++) {
        if (Math.sin(time * 1.2 + i * 1.1 + el.x * 0.02) > 0.15) {
          ctx.fillStyle = 'rgba(255,230,160,0.18)'
          ctx.fillRect(left + bw * 0.08, top + 8 + i * (h * 0.18), bw * 0.22, 4)
        }
      }
    } else {
      const h = el.height * 3.4
      const top = gY - h
      const cx = left + bw / 2

      ctx.fillStyle = '#121820'
      ctx.fillRect(left, top + h * 0.14, bw, h * 0.86)

      ctx.fillStyle = '#181f2e'
      ctx.fillRect(left + bw * 0.08, top + h * 0.04, bw * 0.84, h * 0.2)

      ctx.fillStyle = '#1e2635'
      ctx.fillRect(left + bw * 0.38, top, bw * 0.24, h * 0.08)

      ctx.strokeStyle = 'rgba(255,200,120,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx, top)
      ctx.lineTo(cx, top - h * 0.1)
      ctx.stroke()

      if (Math.sin(time * 5 + el.x * 0.015) > 0.25) {
        ctx.fillStyle = 'rgba(255,60,60,0.95)'
        ctx.beginPath()
        ctx.arc(cx, top - h * 0.1, 2.2, 0, Math.PI * 2)
        ctx.fill()
      }

      const cols = Math.max(2, Math.floor(bw / 7))
      const rowH = 9
      const rows = Math.min(18, Math.floor((h * 0.72) / rowH))
      const wx0 = left + bw * 0.07
      const wy0 = top + h * 0.17
      const cellW = (bw * 0.86) / cols
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = Math.sin(time * 2.2 + r * 0.5 + c * 0.6 + el.x * 0.02) > -0.15
          ctx.fillStyle = lit ? 'rgba(255,248,210,0.28)' : 'rgba(70,80,100,0.12)'
          ctx.fillRect(wx0 + c * cellW + 0.5, wy0 + r * rowH, cellW - 1.5, 5)
        }
      }

      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(left + bw * 0.91, top + h * 0.18, bw * 0.05, h * 0.68)
    }
  }

  private drawGhostTree(ctx: CanvasRenderingContext2D, el: BackgroundElement) {
    ctx.fillStyle = '#1a1a30'
    ctx.fillRect(el.x + el.width * 0.4, el.y + el.height * 0.3, el.width * 0.2, el.height * 0.7)

    ctx.fillStyle = '#2a2a50'
    ctx.beginPath()
    ctx.arc(el.x + el.width / 2, el.y + el.height * 0.3, el.width * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderGroundDetail(ctx: CanvasRenderingContext2D, _biome: BiomeManager, _time: number) {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    const spacing = 80
    for (let x = 0; x < this.canvasW; x += spacing) {
      ctx.beginPath()
      ctx.moveTo(x, this.groundY + 10)
      ctx.lineTo(x + 30, this.groundY + 10)
      ctx.stroke()
    }
  }
}
