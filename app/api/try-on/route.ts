import { NextRequest, NextResponse } from 'next/server'

function getResultImageUrl(payload: any): string | null {
  const candidates = [
    payload?.data?.results?.image_url,
    payload?.data?.results?.output?.[0]?.url,
    payload?.data?.results?.output?.[0]?.image_url,
    payload?.data?.output?.[0]?.url,
    payload?.results?.image_url,
    payload?.results?.output?.[0]?.url,
    payload?.dst_image_url,
    payload?.dst_image,
  ]
  return candidates.find((value) => typeof value === 'string' && value.length > 0) ?? null
}

function joinUrl(baseUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  return `${baseUrl.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`
}

function resolveEffectsFromProduct(product: {
  productId: string
  productName: string
  productType: string
  productColor: string
}) {
  const configured = process.env.PERFECT_CORP_EFFECTS_MAP_JSON
  if (configured) {
    try {
      const parsed = JSON.parse(configured) as Record<string, unknown>
      const mapped = parsed[product.productId] ?? parsed[product.productType]
      if (Array.isArray(mapped)) return mapped
    } catch (error) {
      console.warn('Invalid PERFECT_CORP_EFFECTS_MAP_JSON:', error)
    }
  }

  // Safe fallback: no custom effects unless explicitly configured.
  return []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { srcFileId, productId, productName, productType, productColor } = body

    if (!srcFileId || !productId || !productName || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.PERFECT_CORP_API_URL ?? 'https://yce-api-01.makeupar.com'
    const apiKey = process.env.PERFECT_CORP_API_KEY ?? process.env.VITE_PERFECT_CORP_API_KEY
    const taskEndpoint = process.env.PERFECT_CORP_TASK_ENDPOINT ?? '/s2s/v2.0/task/makeup-vto'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const taskUrl = joinUrl(baseUrl, taskEndpoint)

    const effects = resolveEffectsFromProduct({
      productId,
      productName,
      productType,
      productColor,
    })

    const createTaskResponse = await fetch(taskUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        src_file_id: srcFileId,
        effects,
        version: '1.0',
      }),
      cache: 'no-store',
    })

    if (!createTaskResponse.ok) {
      return NextResponse.json(
        {
          error: 'Perfect Corp task creation failed',
          details: await createTaskResponse.text(),
        },
        { status: 502 }
      )
    }

    const taskPayload = await createTaskResponse.json()
    const taskId = taskPayload?.data?.task_id
    if (!taskId) {
      return NextResponse.json(
        { error: 'Perfect Corp response missing task_id' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        confidence: 0.95,
        processingTime: 0,
        productApplied: {
          name: productName,
          color: productColor,
          type: productType,
          id: productId,
        },
        provider: {
          taskId,
        },
      },
    })
  } catch (error) {
    console.error('Try-on processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process try-on' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const baseUrl = process.env.PERFECT_CORP_API_URL ?? 'https://yce-api-01.makeupar.com'
    const apiKey = process.env.PERFECT_CORP_API_KEY ?? process.env.VITE_PERFECT_CORP_API_KEY
    const pollTemplate =
      process.env.PERFECT_CORP_TASK_STATUS_ENDPOINT_TEMPLATE ??
      '/s2s/v2.0/task/makeup-vto/{task_id}'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const pollUrl = joinUrl(baseUrl, pollTemplate.replace('{task_id}', encodeURIComponent(taskId)))
    const pollResponse = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!pollResponse.ok) {
      return NextResponse.json(
        { error: 'Perfect Corp polling failed', details: await pollResponse.text() },
        { status: 502 }
      )
    }

    const payload = await pollResponse.json()
    const status = payload?.data?.task_status ?? payload?.task_status ?? payload?.status
    const processedImage = getResultImageUrl(payload)
    const providerError =
      payload?.error ??
      payload?.data?.error ??
      payload?.data?.results?.error ??
      payload?.message ??
      null

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status,
        processedImage,
        providerError,
        raw: payload,
      },
    })
  } catch (error) {
    console.error('Try-on status error:', error)
    return NextResponse.json({ error: 'Failed to poll try-on task' }, { status: 500 })
  }
}
