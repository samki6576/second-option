import { NextRequest, NextResponse } from 'next/server'

// In-memory store (use Redis/DB in production)
const webhookEvents = new Map<string, any>()
const taskStatusStore = new Map<string, {
    taskId: string
    status: string
    resultImage?: string
    error?: string
    updatedAt: Date
    webhookReceived: boolean
}>()
const fileUploadStore = new Map<string, {
    fileId: string
    fileName: string
    fileSize: number
    contentType: string
    status: string
    uploadedAt: Date
}>()

// Verify webhook signature
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
    if (!signature || !secret) return false

    const crypto = require('crypto')
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        )
    } catch {
        return false
    }
}

// Store file upload webhook
function handleFileUploadWebhook(payload: any) {
    const fileId = payload.file_id || payload.fileId || `file_${Date.now()}`

    const fileData = {
        fileId: fileId,
        fileName: payload.fileName || payload.filename,
        fileSize: payload.fileSize || payload.size,
        contentType: payload.contentType || payload.mime_type,
        status: 'uploaded',
        uploadedAt: new Date()
    }

    fileUploadStore.set(fileId, fileData)
    console.log('File upload webhook processed:', fileData)

    return fileData
}

// Store task completion webhook
function handleTaskWebhook(taskId: string, payload: any) {
    const existing = taskStatusStore.get(taskId) || {
        taskId,
        status: 'pending',
        updatedAt: new Date(),
        webhookReceived: true
    }

    // Update status based on payload
    const status = payload.status || payload.task_status || payload.state
    const resultImage = payload.result_image ||
        payload.image_url ||
        payload.output?.image_url ||
        payload.data?.result_image

    if (status === 'completed' || status === 'success' || status === 'done') {
        existing.status = 'completed'
        if (resultImage) existing.resultImage = resultImage
    } else if (status === 'failed' || status === 'error') {
        existing.status = 'failed'
        existing.error = payload.error || payload.message || 'Unknown error'
    } else {
        existing.status = status || 'processing'
    }

    existing.updatedAt = new Date()
    existing.webhookReceived = true

    taskStatusStore.set(taskId, existing)
    console.log(`Task webhook stored for ${taskId}:`, existing)

    return existing
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text()
        const signature = request.headers.get('x-webhook-signature') ||
            request.headers.get('webhook-signature') ||
            request.headers.get('x-perfect-corp-signature')

        // Verify webhook signature
        const webhookSecret = process.env.PERFECT_CORP_WEBHOOK_SECRET
        if (webhookSecret && signature) {
            const isValid = verifySignature(rawBody, signature, webhookSecret)
            if (!isValid) {
                console.error('Invalid webhook signature')
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
            }
            console.log('Webhook signature verified')
        }

        // Parse payload
        let payload
        try {
            payload = JSON.parse(rawBody)
        } catch (e) {
            console.error('Invalid JSON payload:', rawBody)
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        console.log('Webhook received:', JSON.stringify(payload, null, 2))

        // Determine webhook type based on payload structure
        let webhookType = 'unknown'
        let response = null

        // Check if it's a file upload webhook
        if (payload.fileName || payload.contentType || payload.fileSize) {
            webhookType = 'file_upload'
            response = handleFileUploadWebhook(payload)
        }
        // Check if it's a task completion webhook
        else if (payload.task_id || payload.taskId || payload.id) {
            webhookType = 'task'
            const taskId = payload.task_id || payload.taskId || payload.id
            response = handleTaskWebhook(taskId, payload)
        }
        // Check if it's a generic event
        else if (payload.event || payload.type) {
            webhookType = payload.event || payload.type
            const taskId = payload.data?.task_id || payload.task_id
            if (taskId) {
                response = handleTaskWebhook(taskId, payload)
            } else {
                response = { received: true, type: webhookType }
            }
        }
        // Unknown webhook type - store raw for debugging
        else {
            webhookType = 'unknown'
            const eventId = `event_${Date.now()}`
            webhookEvents.set(eventId, {
                type: webhookType,
                payload: payload,
                receivedAt: new Date()
            })
            response = { received: true, eventId, type: webhookType }
        }

        // Store all webhook events for debugging
        const eventId = `webhook_${Date.now()}`
        webhookEvents.set(eventId, {
            id: eventId,
            type: webhookType,
            payload: payload,
            processedAt: new Date(),
            response: response
        })

        // Clean up old events (keep last 1000)
        if (webhookEvents.size > 1000) {
            const oldestKey = Array.from(webhookEvents.keys())[0]
            webhookEvents.delete(oldestKey)
        }

        // Log webhook type
        console.log(`Processed ${webhookType} webhook successfully`)

        // Return 200 OK to acknowledge receipt
        return NextResponse.json({
            received: true,
            type: webhookType,
            processed: true,
            timestamp: new Date().toISOString(),
            data: response
        })

    } catch (error) {
        console.error('Webhook processing error:', error)
        return NextResponse.json({
            error: 'Webhook processing failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

// GET endpoint to retrieve webhook data
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const fileId = searchParams.get('fileId')
    const recent = searchParams.get('recent') === 'true'
    const type = searchParams.get('type') // 'task', 'file', or 'all'

    // Return recent events
    if (recent) {
        const recentEvents = Array.from(webhookEvents.entries())
            .slice(-50)
            .map(([key, value]) => ({ id: key, ...value }))
        return NextResponse.json({
            success: true,
            count: recentEvents.length,
            events: recentEvents
        })
    }

    // Get specific task status
    if (taskId) {
        const status = taskStatusStore.get(taskId)
        if (!status) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }
        return NextResponse.json({
            success: true,
            type: 'task',
            data: status
        })
    }

    // Get specific file status
    if (fileId) {
        const fileStatus = fileUploadStore.get(fileId)
        if (!fileStatus) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }
        return NextResponse.json({
            success: true,
            type: 'file',
            data: fileStatus
        })
    }

    // Return summary of all stores
    return NextResponse.json({
        success: true,
        summary: {
            tasks: taskStatusStore.size,
            files: fileUploadStore.size,
            events: webhookEvents.size,
            latestTask: taskStatusStore.size > 0 ? Array.from(taskStatusStore.values()).pop() : null,
            latestFile: fileUploadStore.size > 0 ? Array.from(fileUploadStore.values()).pop() : null
        }
    })
}

// DELETE endpoint to clear webhook data
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const clearAll = searchParams.get('all') === 'true'
    const olderThan = parseInt(searchParams.get('olderThan') || (24 * 60 * 60 * 1000).toString())

    if (clearAll) {
        webhookEvents.clear()
        taskStatusStore.clear()
        fileUploadStore.clear()
        return NextResponse.json({
            success: true,
            message: 'All webhook data cleared'
        })
    }

    const now = Date.now()
    let deletedEvents = 0
    let deletedTasks = 0
    let deletedFiles = 0

    // Delete old events
    for (const [key, value] of webhookEvents.entries()) {
        const timestamp = key.includes('_') ? parseInt(key.split('_')[1]) : 0
        if (now - timestamp > olderThan) {
            webhookEvents.delete(key)
            deletedEvents++
        }
    }

    // Delete old tasks
    for (const [key, value] of taskStatusStore.entries()) {
        if (now - value.updatedAt.getTime() > olderThan) {
            taskStatusStore.delete(key)
            deletedTasks++
        }
    }

    // Delete old files
    for (const [key, value] of fileUploadStore.entries()) {
        if (now - value.uploadedAt.getTime() > olderThan) {
            fileUploadStore.delete(key)
            deletedFiles++
        }
    }

    return NextResponse.json({
        success: true,
        deleted: {
            events: deletedEvents,
            tasks: deletedTasks,
            files: deletedFiles
        }
    })
}