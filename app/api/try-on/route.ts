import { NextRequest, NextResponse } from 'next/server'
import { processTryOn } from '@/lib/mock-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { image, productId, productName, productType, productColor } = body

    if (!image || !productId || !productName || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process the try-on
    const result = await processTryOn({
      image,
      productId,
      productName,
      productType,
      productColor,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Try-on processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process try-on' },
      { status: 500 }
    )
  }
}
