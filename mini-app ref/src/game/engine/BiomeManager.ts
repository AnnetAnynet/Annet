import { BIOMES, BIOME_DURATION_S, BIOME_TRANSITION_S, MAX_BIOMES } from './constants'
import type { BiomeConfig } from './types'

/**
 * Tracks which biome the player is in and cross-fade transitions.
 *
 * Biome order is pluggable: `biomeOrder` is an array of indices into `BIOMES[]`
 * of length `MAX_BIOMES`. Position in the order (0..MAX_BIOMES-1) advances with
 * time; external consumers see the real `BIOMES[]` index via `currentIndex`
 * / `spawnIndex` so existing sprite/theming code keeps working.
 */
export class BiomeManager {
  private position = 0
  private biomeOrder: number[] = BiomeManager.defaultOrder()
  private transitionProgress = 0
  private isTransitioning = false

  private static defaultOrder(): number[] {
    return Array.from({ length: MAX_BIOMES }, (_, i) => i)
  }

  setBiomeOrder(order: number[]) {
    if (order.length !== MAX_BIOMES) return
    this.biomeOrder = order.slice()
  }

  /** Index into `BIOMES[]` for the currently-rendered biome. */
  get currentIndex(): number {
    return this.biomeOrder[this.position] ?? 0
  }

  get current(): BiomeConfig {
    return BIOMES[this.currentIndex]
  }

  get next(): BiomeConfig | null {
    if (this.position + 1 >= MAX_BIOMES) return null
    return BIOMES[this.biomeOrder[this.position + 1]]
  }

  get transition(): number {
    return this.transitionProgress
  }

  get transitioning(): boolean {
    return this.isTransitioning
  }

  /** Index into `BIOMES[]` used by obstacle/background spawners. */
  get spawnIndex(): number {
    if (this.isTransitioning && this.position + 1 < MAX_BIOMES) {
      return this.biomeOrder[this.position + 1]
    }
    return this.currentIndex
  }

  update(elapsedTime: number, dt: number) {
    const positionForTime = Math.min(
      Math.floor(elapsedTime / BIOME_DURATION_S),
      MAX_BIOMES - 1,
    )

    if (positionForTime > this.position) {
      if (!this.isTransitioning) {
        this.isTransitioning = true
        this.transitionProgress = 0
      }
      this.transitionProgress += dt / BIOME_TRANSITION_S
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 0
        this.isTransitioning = false
        this.position = positionForTime
      }
    }
  }

  reset() {
    this.position = 0
    this.transitionProgress = 0
    this.isTransitioning = false
  }

  interpolateColor(c1: string, c2: string, t: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16)
    const g1 = parseInt(c1.slice(3, 5), 16)
    const b1 = parseInt(c1.slice(5, 7), 16)
    const r2 = parseInt(c2.slice(1, 3), 16)
    const g2 = parseInt(c2.slice(3, 5), 16)
    const b2 = parseInt(c2.slice(5, 7), 16)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return `rgb(${r},${g},${b})`
  }

  getSkyTop(): string {
    if (!this.isTransitioning || !this.next) return this.current.skyTop
    return this.interpolateColor(this.current.skyTop, this.next.skyTop, this.transitionProgress)
  }

  getSkyBottom(): string {
    if (!this.isTransitioning || !this.next) return this.current.skyBottom
    return this.interpolateColor(this.current.skyBottom, this.next.skyBottom, this.transitionProgress)
  }

  getGroundColor(): string {
    if (!this.isTransitioning || !this.next) return this.current.groundColor
    return this.interpolateColor(this.current.groundColor, this.next.groundColor, this.transitionProgress)
  }

  getGroundLine(): string {
    if (!this.isTransitioning || !this.next) return this.current.groundLine
    return this.interpolateColor(this.current.groundLine, this.next.groundLine, this.transitionProgress)
  }
}
