export type InputAction = 'jump' | 'crouchStart' | 'crouchEnd' | 'none'

function isTypingInEditableField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export class InputHandler {
  private canvas: HTMLCanvasElement
  private actions: InputAction[] = []
  private touchStartY = 0
  private touchActive = false
  private swipedDown = false
  private readonly SWIPE_THRESHOLD = 20

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.bindTouch()
    this.bindKeyboard()
  }

  private bindTouch() {
    const opts: AddEventListenerOptions = { passive: false }

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (e.touches.length === 0) return
      this.touchStartY = e.touches[0].clientY
      this.touchActive = true
      this.swipedDown = false
    }, opts)

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (!this.touchActive || e.touches.length === 0) return
      const dy = e.touches[0].clientY - this.touchStartY
      if (dy > this.SWIPE_THRESHOLD && !this.swipedDown) {
        this.swipedDown = true
        this.actions.push('crouchStart')
      }
    }, opts)

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      if (this.swipedDown) {
        this.actions.push('crouchEnd')
      } else if (this.touchActive) {
        this.actions.push('jump')
      }
      this.touchActive = false
      this.swipedDown = false
    }, opts)

    this.canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault()
      if (this.swipedDown) {
        this.actions.push('crouchEnd')
      }
      this.touchActive = false
      this.swipedDown = false
    }, opts)

    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault()
      this.actions.push('jump')
    })
  }

  private bindKeyboard() {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingInEditableField(e.target)) return
      if (e.repeat) return
      if (e.type === 'keydown') {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault()
          this.actions.push('jump')
        }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault()
          this.actions.push('crouchStart')
        }
      }
      if (e.type === 'keyup') {
        if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.actions.push('crouchEnd')
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('keyup', onKey)
    this._keyHandler = onKey
  }

  private _keyHandler: ((e: KeyboardEvent) => void) | null = null

  flush(): InputAction[] {
    const out = this.actions.slice()
    this.actions.length = 0
    return out
  }

  destroy() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler)
      document.removeEventListener('keyup', this._keyHandler)
    }
  }
}
