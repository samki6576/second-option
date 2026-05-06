'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger?: boolean
}

export function Confetti({ trigger = true }: ConfettiProps) {
  const containerRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!trigger || !containerRef.current) return

    const canvas = containerRef.current

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create confetti instance
    const instance = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })

    // Trigger confetti burst
    instance({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#dc2626', '#06b6d4', '#f59e0b', '#10b981'],
    })

    // Second burst for more celebration
    setTimeout(() => {
      instance({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#8b5cf6', '#dc2626', '#06b6d4'],
      })
    }, 250)

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [trigger])

  return (
    <canvas
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  )
}
