'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { Navigation } from '@/components/navigation'
import { Webcam } from '@/components/webcam'
import { ProductSelector, Product } from '@/components/product-selector'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Share2, Users, Upload, X } from 'lucide-react'
import Link from 'next/link'
import type { TryOnResult } from '@/lib/mock-api'

export default function TryOnPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [apiResult, setApiResult] = useState<TryOnResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApiLoading, setIsApiLoading] = useState(false)

  const handleImageCapture = (image: string) => {
    setCapturedImage(image)
    setUploadError(null)
  }

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (JPEG, PNG, etc.)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image is too large. Please upload an image under 10MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedImage(reader.result)
        setUploadError(null)
        // Simulate AI processing
        setIsProcessing(true)
        setTimeout(() => setIsProcessing(false), 1000)
      }
    }

    reader.onerror = () => {
      setUploadError('Unable to read the image. Please try again.')
    }

    reader.readAsDataURL(file)
    
    // Reset file input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleProcessTryOn = async () => {
    if (!capturedImage || !selectedProduct) {
      setApiError('Please upload or capture an image and select a product first.')
      return
    }

    setApiError(null)
    setIsApiLoading(true)
    setApiResult(null)

    try {
      const response = await fetch('/api/try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: capturedImage,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productType: selectedProduct.type,
          productColor: selectedProduct.color,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setApiError(result?.error || 'API request failed. Please try again.')
      } else {
        setApiResult(result.data)
      }
    } catch (error) {
      setApiError('Unable to connect to the try-on API. Please try again.')
    } finally {
      setIsApiLoading(false)
    }
  }

  const resetImage = () => {
    setCapturedImage(null)
    setUploadError(null)
    setSelectedProduct(null)
  }

  const createVotingRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const tryOnPreviewImage = apiResult?.processedImage ?? capturedImage

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#0A0A0A] to-[#1A1A2E]">
      <Navigation />

      <section className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[#C084FC] via-[#FF6B6B] to-[#00F0FF] bg-clip-text text-transparent mb-4">
              Virtual Try-On
            </h1>
            <p className="text-gray-400 text-lg">
              Capture or upload your photo and try on products instantly
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column - Image Capture */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                📸 Step 1: Your Photo
              </h2>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Upload Button */}
              <button
                onClick={triggerFileUpload}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-[#C084FC]/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all group"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-[#C084FC] group-hover:scale-110 transition-transform" />
                  <span className="text-white font-medium">Click to Upload Photo</span>
                  <span className="text-gray-500 text-sm">JPEG, PNG up to 10MB</span>
                </div>
              </button>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-[#0A0A0A] text-gray-500">OR</span>
                </div>
              </div>

              {/* Webcam Component */}
              <Webcam onCapture={handleImageCapture} />

              {uploadError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {uploadError}
                  </p>
                </div>
              )}

              {/* Preview after capture */}
              {capturedImage && (
                <div className="rounded-2xl border border-[#C084FC]/30 bg-white/5 backdrop-blur-sm p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    🖼️ Your Photo
                  </h3>
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
                    <img
                      src={capturedImage}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={resetImage}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  {isProcessing && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#C084FC] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-400">Processing image...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Product Selector */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                🛍️ Step 2: Choose Product
              </h2>
              <ProductSelector
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
              />
            </div>
          </div>

          {/* Results Section */}
          {capturedImage && selectedProduct && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-[#C084FC]/30 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  ✨ Step 3: Your Try-On Result
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Original</h3>
                    <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-square">
                      <img
                        src={capturedImage}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Try-On Result */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                      Wearing {selectedProduct.name}
                    </h3>
                    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#C084FC]/20 to-[#FF6B6B]/20 aspect-square flex items-center justify-center border border-[#C084FC]/30">
                      <div className="text-center">
                        <div className="relative">
                          <img
                            src={tryOnPreviewImage ?? ''}
                            alt="Try-on preview"
                            className="w-full h-full object-cover rounded-xl opacity-50"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="w-24 h-24 rounded-full shadow-2xl animate-pulse"
                              style={{
                                backgroundColor: 
                                  selectedProduct.color === 'Red' ? '#dc2626' :
                                  selectedProduct.color === 'Berry' ? '#9333ea' :
                                  selectedProduct.color === 'Nude' ? '#d4a574' :
                                  selectedProduct.color === 'Gold' ? '#fbbf24' :
                                  selectedProduct.color === 'Silver' ? '#9ca3af' :
                                  selectedProduct.color === 'Black' ? '#1f2937' :
                                  '#6b7280',
                                boxShadow: '0 0 30px rgba(192,132,252,0.5)'
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-white mt-3">
                          {selectedProduct.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {selectedProduct.category} • {selectedProduct.color}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button
                    onClick={handleProcessTryOn}
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-[#C084FC] to-[#FF6B6B] hover:shadow-xl transition-all"
                    disabled={isApiLoading}
                  >
                    {isApiLoading ? 'Processing...' : 'Process Try-On'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-[#C084FC]/50 text-white hover:bg-[#C084FC]/20"
                    disabled={!apiResult}
                  >
                    <Share2 className="w-4 h-4" />
                    Share Result
                  </Button>
                </div>
                {apiError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    {apiError}
                  </div>
                )}
                {apiResult && (
                  <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-100">
                    API try-on generated successfully. Confidence: {Math.round(apiResult.confidence * 100)}%
                  </div>
                )}
              </Card>

              {/* Voting Room Created */}
              {roomCode && (
                <Card className="border-[#00F0FF]/30 bg-gradient-to-r from-[#00F0FF]/10 to-[#C084FC]/10 backdrop-blur-sm p-6 animate-in zoom-in duration-300">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-[#00F0FF]/20 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#00F0FF]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Voting Room Created! 🎉
                    </h3>
                    <div className="bg-black/50 rounded-lg p-4 mb-4 inline-block mx-auto">
                      <p className="text-sm text-gray-400 mb-1">Room Code</p>
                      <p className="text-3xl font-bold text-[#00F0FF] font-mono tracking-wider">
                        {roomCode}
                      </p>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      Share this code with friends to get their opinion!
                    </p>
                    <Link href={`/rooms/${roomCode}`}>
                      <Button className="gap-2 bg-gradient-to-r from-[#00F0FF] to-[#C084FC]">
                        Enter Voting Room →
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}