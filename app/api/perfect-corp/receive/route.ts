import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Use a server-side env var first; keep legacy fallback for compatibility.
    const webhookSecret =
      process.env.PERFECT_CORP_WEBHOOK_SECRET ??
      process.env.VITE_PERFECT_CORP_WEBHOOK_SECRET
    const incomingSecret = request.headers.get('x-webhook-secret')

    if (webhookSecret) {
      if (!incomingSecret || incomingSecret !== webhookSecret) {
        return NextResponse.json(
          { error: 'Invalid webhook secret' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()

    // Example payload: { event: 'tryon.completed', data: { ... } }
    console.log('Perfect Corp webhook received:', JSON.stringify(body, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Perfect Corp data received',
      received: body,
    })
  } catch (error) {
    console.error('Perfect Corp receive endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to receive Perfect Corp data' },
      { status: 500 }
    )
  }
}
