'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Camera, Loader2 } from 'lucide-react'

interface WebcamProps {
  onCapture: (image: string) => void
}

export function Webcam({ onCapture }: WebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            setIsLoading(false)
          }
        }
      } catch (err) {
        setError('Unable to access camera. Please check permissions.')
        setIsLoading(false)
      }
    }

    startWebcam()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    const imageData = canvasRef.current.toDataURL('image/jpeg')
    onCapture(imageData)
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <p className="text-red-400 text-center px-4">{error}</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={captureImage}
          disabled={isLoading || !!error}
          className="flex-1 gap-2"
          size="lg"
        >
          <Camera className="w-4 h-4" />
          Capture Image
        </Button>
      </div>
    </div>
  )
}
