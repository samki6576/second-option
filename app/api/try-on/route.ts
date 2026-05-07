import { NextRequest, NextResponse } from 'next/server'

type UploadRequest = {
  method?: 'PUT' | 'POST'
  url: string
  headers?: Record<string, string>
}

type FileEntry = {
  file_id?: string
  requests?: UploadRequest[]
}

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  return { mime: match[1], buffer: Buffer.from(match[2], 'base64') }
}

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

async function initAndUploadFile(
  apiKey: string,
  fileEndpointUrl: string,
  imageDataUrl: string,
  fileName: string
): Promise<string> {
  const parsed = parseDataUrl(imageDataUrl)
  if (!parsed) throw new Error('Invalid image format. Expected base64 data URL.')

  const initResponse = await fetch(fileEndpointUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [
        {
          content_type: parsed.mime,
          file_name: fileName,
          file_size: parsed.buffer.length,
        },
      ],
    }),
    cache: 'no-store',
  })

  if (!initResponse.ok) {
    throw new Error(`File init failed: ${await initResponse.text()}`)
  }

  const initPayload = await initResponse.json()
  const fileEntry = initPayload?.data?.files?.[0] as FileEntry | undefined
  const upload = fileEntry?.requests?.[0]
  if (!upload?.url || !fileEntry?.file_id) {
    throw new Error('File init response missing upload URL or file_id')
  }

  const uploadResponse = await fetch(upload.url, {
    method: upload.method ?? 'PUT',
    headers: upload.headers ?? {
      'Content-Type': parsed.mime,
      'Content-Length': String(parsed.buffer.length),
    },
    body: parsed.buffer as unknown as BodyInit,
    cache: 'no-store',
  })

  if (!uploadResponse.ok) {
    throw new Error(`File upload failed: ${await uploadResponse.text()}`)
  }

  return fileEntry.file_id
}

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

    const baseUrl = process.env.PERFECT_CORP_API_URL ?? 'https://yce-api-01.makeupar.com'
    const apiKey = process.env.PERFECT_CORP_API_KEY ?? process.env.VITE_PERFECT_CORP_API_KEY
    const fileEndpoint = process.env.PERFECT_CORP_FILE_ENDPOINT ?? '/s2s/v2.0/file/makeup-vto'
    const taskEndpoint = process.env.PERFECT_CORP_TASK_ENDPOINT ?? '/s2s/v2.0/task/makeup-vto'
    const pollTemplate =
      process.env.PERFECT_CORP_TASK_STATUS_ENDPOINT_TEMPLATE ??
      '/s2s/v2.0/task/makeup-vto/{task_id}'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const fileUrl = joinUrl(baseUrl, fileEndpoint)
    const taskUrl = joinUrl(baseUrl, taskEndpoint)

    const srcFileId = await initAndUploadFile(apiKey, fileUrl, image, `src_${Date.now()}.png`)
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

    let finalPayload: any = null
    for (let i = 0; i < 15; i += 1) {
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

      const pollPayload = await pollResponse.json()
      const status =
        pollPayload?.data?.task_status ?? pollPayload?.task_status ?? pollPayload?.status

      if (status === 'success') {
        finalPayload = pollPayload
        break
      }
      if (status === 'error' || status === 'failed') {
        return NextResponse.json(
          { error: 'Perfect Corp processing failed', details: pollPayload },
          { status: 502 }
        )
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    if (!finalPayload) {
      return NextResponse.json(
        { error: 'Perfect Corp processing timed out' },
        { status: 504 }
      )
    }

    const processedImage = getResultImageUrl(finalPayload) ?? image

    return NextResponse.json({
      success: true,
      data: {
        originalImage: image,
        processedImage,
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
