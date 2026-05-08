import { NextRequest, NextResponse } from 'next/server'

// Store all raw webhook data
const rawWebhooks: any[] = []

export async function POST(request: NextRequest) {
    const rawBody = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    const webhookData = {
        timestamp: new Date().toISOString(),
        headers: headers,
        body: rawBody,
        parsed: null
    }

    try {
        webhookData.parsed = JSON.parse(rawBody)
    } catch (e) {
        webhookData.parsed = { error: 'Invalid JSON' }
    }

    rawWebhooks.push(webhookData)

    // Keep only last 100
    while (rawWebhooks.length > 100) {
        rawWebhooks.shift()
    }

    console.log('Raw webhook received:', JSON.stringify(webhookData, null, 2))

    return NextResponse.json({
        received: true,
        stored: rawWebhooks.length
    })
}

export async function GET(request: NextRequest) {
    return NextResponse.json({
        count: rawWebhooks.length,
        webhooks: rawWebhooks
    })
}