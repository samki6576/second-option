declare module 'canvas-confetti' {
  export interface ConfettiOptions {
    particleCount?: number
    spread?: number
    startVelocity?: number
    gravity?: number
    drift?: number
    ticks?: number
    origin?: {
      x?: number
      y?: number
    }
    [key: string]: any
  }

  export interface CanvasConfetti {
    (options?: ConfettiOptions): void
    create: (canvas: HTMLCanvasElement, options?: any) => CanvasConfetti
  }

  const confetti: CanvasConfetti
  export default confetti
}
