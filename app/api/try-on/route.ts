import { NextRequest, NextResponse } from 'next/server'

function getResultImageUrl(payload: any): string | null {
  const candidates = [
    payload?.data?.results?.image_url,
    payload?.data?.results?.output?.[0]?.url,
    payload?.data?.output?.[0]?.url,
    payload?.results?.image_url,
    payload?.dst_image_url,
    payload?.dst_image,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }
  return null
}

function joinUrl(baseUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = pathOrUrl.replace(/^\/+/, '')
  return `${cleanBase}/${cleanPath}`
}

function createEffectsForProduct(product: {
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
      if (Array.isArray(mapped)) {
        return mapped
      }
    } catch (error) {
      console.warn('Invalid PERFECT_CORP_EFFECTS_MAP_JSON:', error)
    }
  }

  const colorHexMap: Record<string, string> = {
    'Red': '#FF0000',
    'Berry': '#8B008B',
    'Nude': '#E8B4B4',
    'Medium': '#E8B4B4',
    'Coral': '#FF7F50',
    'Smokey': '#4B4B4B',
  }

  const colorHex = colorHexMap[product.productColor] || product.productColor || '#FF0000'
  const normalizedType = product.productType.toLowerCase()

  if (normalizedType === 'lipstick') {
    return [
      {
        category: 'lip_color',
        shape: { name: 'original' },
        palettes: [
          {
            color: colorHex,
            texture: 'matte',
            colorIntensity: 80,
          },
        ],
        style: { type: 'full' },
      },
    ]
  }

  if (normalizedType === 'foundation') {
    return [
      {
        category: 'foundation',
        palettes: [
          {
            color: colorHex,
            colorIntensity: 60,
            glowIntensity: 20,
            coverageIntensity: 65,
          },
        ],
      },
    ]
  }

  if (normalizedType === 'eyeshadow') {
    // Pattern names are provider-catalog specific; avoid invalid_parameter fallback.
    return []
  }

  if (normalizedType === 'blush') {
    // Pattern names are provider-catalog specific; avoid invalid_parameter fallback.
    return []
  }

  return []
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      srcFileId,
      productId,
      productName,
      productType,
      productColor,
      useWebhook = true  // Enable webhook by default
    } = body

    if (!srcFileId || !productId || !productName || !productType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.PERFECT_CORP_API_URL || 'https://yce-api-01.perfectcorp.com'
    const taskEndpoint = process.env.PERFECT_CORP_TASK_ENDPOINT || '/s2s/v2.0/task/makeup-vto'
    const apiKey = process.env.PERFECT_CORP_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const effects = createEffectsForProduct({
      productId,
      productName,
      productType,
      productColor: productColor || 'Red',
    })

    const taskUrl = joinUrl(baseUrl, taskEndpoint)

    const requestBody: any = {
      src_file_id: srcFileId,
      effects: effects,
      version: '1.0',
    }

    // Add webhook URL if enabled
    if (useWebhook) {
      const webhookUrl = process.env.WEBHOOK_BASE_URL || 'https://second-option.vercel.app'
      requestBody.webhook_url = `${webhookUrl}/api/webhook/perfect-corp`
      requestBody.notification_url = `${webhookUrl}/api/webhook/perfect-corp`
      requestBody.callback_url = `${webhookUrl}/api/webhook/perfect-corp`
    }

    console.log('Creating task with webhook:', requestBody.webhook_url)

    const createTaskResponse = await fetch(taskUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await createTaskResponse.text()
    console.log('Perfect Corp Response:', responseText)

    if (!createTaskResponse.ok) {
      return NextResponse.json(
        {
          error: 'Perfect Corp API request failed',
          status: createTaskResponse.status,
          details: responseText,
        },
        { status: 502 }
      )
    }

    let taskPayload
    try {
      taskPayload = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response', details: responseText },
        { status: 502 }
      )
    }

    const taskId = taskPayload?.data?.task_id || taskPayload?.task_id

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing task_id', details: taskPayload },
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
        webhookEnabled: useWebhook,
      },
    })
  } catch (error) {
    console.error('Try-on error:', error)
    return NextResponse.json(
      { error: 'Failed to process try-on', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const useWebhook = searchParams.get('useWebhook') === 'true'

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    // If webhook is enabled, check webhook store first
    if (useWebhook) {
      const webhookCheck = await fetch(`${process.env.WEBHOOK_BASE_URL || 'https://second-option.vercel.app'}/api/webhook/perfect-corp?taskId=${taskId}`)
      if (webhookCheck.ok) {
        const webhookData = await webhookCheck.json()
        if (webhookData.success && webhookData.data) {
          return NextResponse.json({
            success: true,
            data: {
              taskId,
              status: webhookData.data.status,
              processedImage: webhookData.data.resultImage,
              source: 'webhook'
            }
          })
        }
      }
    }

    // Fallback to polling if webhook not available
    const baseUrl = process.env.PERFECT_CORP_API_URL || 'https://yce-api-01.perfectcorp.com'
    const pollTemplate = process.env.PERFECT_CORP_TASK_STATUS_ENDPOINT_TEMPLATE || '/s2s/v2.0/task/makeup-vto/{task_id}'
    const pollUrl = joinUrl(baseUrl, pollTemplate.replace('{task_id}', encodeURIComponent(taskId)))
    const apiKey = process.env.PERFECT_CORP_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const pollResponse = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
    const providerError = payload?.error ?? payload?.data?.error ?? null

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status,
        processedImage,
        providerError,
        source: 'polling',
        raw: payload,
      },
    })
  } catch (error) {
    console.error('Try-on status error:', error)
    return NextResponse.json(
      { error: 'Failed to poll try-on task' },
      { status: 500 }
    )
  }
}