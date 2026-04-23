import type { Particle } from './types'
import { PARTICLE_MAX } from './constants'

export class ParticleSystem {
  particles: Particle[] = []

  emit(x: number, y: number, count: number, config: Partial<Particle> & { spread?: number }) {
    const spread = config.spread ?? 3
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= PARTICLE_MAX) break
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * spread * 2,
        vy: (Math.random() - 1) * spread,
        life: config.maxLife ?? 0.6,
        maxLife: config.maxLife ?? 0.6,
        size: config.size ?? 3,
        color: config.color ?? '#D56000',
        alpha: 1,
      })
    }
  }

  emitDust(x: number, y: number) {
    if (this.particles.length >= PARTICLE_MAX - 5) return
    this.particles.push({
      x: x - 5 + Math.random() * 10,
      y: y + Math.random() * 4,
      vx: -1 - Math.random() * 2,
      vy: -0.5 - Math.random(),
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.4,
      size: 2 + Math.random() * 2,
      color: 'rgba(180,160,130,0.6)',
      alpha: 0.6,
    })
  }

  emitHit(x: number, y: number) {
    this.emit(x, y, 15, {
      spread: 6,
      maxLife: 0.8,
      size: 4,
      color: '#ff6a00',
    })
    this.emit(x, y, 8, {
      spread: 4,
      maxLife: 0.5,
      size: 2,
      color: '#ffe040',
    })
  }

  emitSnow(canvasW: number) {
    if (this.particles.length >= PARTICLE_MAX - 2) return
    this.particles.push({
      x: Math.random() * canvasW,
      y: -5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.8 + Math.random() * 0.5,
      life: 8,
      maxLife: 8,
      size: 2 + Math.random() * 2,
      color: '#fff',
      alpha: 0.5 + Math.random() * 0.3,
    })
  }

  emitFirefly(canvasW: number, groundY: number) {
    if (this.particles.length >= PARTICLE_MAX - 2) return
    this.particles.push({
      x: Math.random() * canvasW,
      y: groundY * 0.3 + Math.random() * groundY * 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      life: 3 + Math.random() * 2,
      maxLife: 5,
      size: 2,
      color: '#ffe080',
      alpha: 0.7,
    })
  }

  update(dt: number) {
    const step = dt * 60
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx * step
      p.y += p.vy * step
      p.life -= dt
      p.alpha = Math.max(0, p.life / p.maxLife)
      if (p.life <= 0) {
        this.particles.splice(i, 1)
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  reset() {
    this.particles = []
  }
}
