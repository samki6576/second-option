'use client'

import { useState, useEffect } from 'react'

interface TryOnResult {
    taskId: string
    status: string
    processedImage?: string
    error?: string
}

export default function VirtualTryOn() {
    const [fileId, setFileId] = useState<string>('')
    const [selectedProduct, setSelectedProduct] = useState<any>(null)
    const [processing, setProcessing] = useState(false)
    const [result, setResult] = useState<TryOnResult | null>(null)
    const [useWebhook, setUseWebhook] = useState(true)
    const [eventSource, setEventSource] = useState<EventSource | null>(null)

    // Listen for real-time updates
    const listenForUpdates = (taskId: string) => {
        const es = new EventSource(`/api/try-on/stream?taskId=${taskId}`)

        es.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log('SSE Event:', data)

            switch (data.event) {
                case 'connected':
                    console.log('Connected to stream for task:', data.taskId)
                    break
                case 'update':
                    setResult(prev => prev ? {
                        ...prev,
                        status: data.status,
                        processedImage: data.resultImage
                    } : null)
                    break
                case 'complete':
                    setResult(prev => prev ? {
                        ...prev,
                        status: data.status,
                        processedImage: data.resultImage
                    } : null)
                    setProcessing(false)
                    es.close()
                    break
                case 'timeout':
                    console.error('Polling timeout')
                    setProcessing(false)
                    es.close()
                    break
            }
        }

        es.onerror = (error) => {
            console.error('SSE error:', error)
            es.close()
            setProcessing(false)
        }

        setEventSource(es)
        return es
    }

    // Process try-on
    const processTryOn = async () => {
        if (!fileId || !selectedProduct) return

        setProcessing(true)
        setResult(null)

        try {
            const response = await fetch('/api/try-on', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    srcFileId: fileId,
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    productType: selectedProduct.type,
                    productColor: selectedProduct.color,
                    useWebhook: useWebhook
                })
            })

            const data = await response.json()

            if (data.success) {
                setResult({
                    taskId: data.data.taskId,
                    status: 'processing'
                })

                // Start listening for updates
                listenForUpdates(data.data.taskId)
            } else {
                console.error('API error:', data.error)
                setProcessing(false)
            }
        } catch (error) {
            console.error('Try-on error:', error)
            setProcessing(false)
        }
    }

    // Check webhook status manually
    const checkWebhookStatus = async (taskId: string) => {
        const response = await fetch(`/api/webhook/perfect-corp?taskId=${taskId}`)
        const data = await response.json()
        console.log('Webhook status:', data)
        return data
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSource) {
                eventSource.close()
            }
        }
    }, [eventSource])

    return (
        <div className="virtual-tryon">
            <h2>Virtual Try-On with Webhooks</h2>

            <div className="controls">
                <label>
                    <input
                        type="checkbox"
                        checked={useWebhook}
                        onChange={(e) => setUseWebhook(e.target.checked)}
                    />
                    Use Webhooks (Real-time updates)
                </label>
            </div>

            <div className="status">
                {processing && <div className="loading">Processing... {result?.status}</div>}
                {result?.processedImage && (
                    <div className="result">
                        <h3>Result:</h3>
                        <img src={result.processedImage} alt="Try-on result" />
                    </div>
                )}
                {result?.error && <div className="error">Error: {result.error}</div>}
            </div>

            <button
                onClick={processTryOn}
                disabled={processing || !fileId || !selectedProduct}
            >
                {processing ? 'Processing...' : 'Try On'}
            </button>
        </div>
    )
}