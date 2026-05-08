import { NextRequest, NextResponse } from 'next/server'

function joinUrl(baseUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const cleanPath = pathOrUrl.replace(/^\/+/, '')
  return `${cleanBase}/${cleanPath}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, fileName, fileSize } = body ?? {}

    if (!contentType || !fileName || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (fileSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.PERFECT_CORP_API_URL || 'https://yce-api-01.perfectcorp.com'
    const apiKey = process.env.PERFECT_CORP_API_KEY
    const fileEndpoint = process.env.PERFECT_CORP_FILE_ENDPOINT || '/s2s/v2.0/file/makeup-vto'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const initUrl = joinUrl(baseUrl, fileEndpoint)
    const initResponse = await fetch(initUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [
          {
            content_type: contentType,
            file_name: fileName,
            file_size: fileSize,
          },
        ],
      }),
    })

    const responseText = await initResponse.text()

    if (!initResponse.ok) {
      return NextResponse.json(
        {
          error: 'Perfect Corp file init failed',
          status: initResponse.status,
          details: responseText,
        },
        { status: 502 }
      )
    }

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response', details: responseText },
        { status: 502 }
      )
    }

    const fileEntry = responseData?.data?.files?.[0]
    const upload = fileEntry?.requests?.[0]
    const fileId = fileEntry?.file_id

    if (!fileId || !upload?.url) {
      return NextResponse.json(
        {
          error: 'Missing file upload data in Perfect Corp response',
          details: responseData,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId,
        upload: {
          method: upload.method || 'PUT',
          url: upload.url,
          headers: upload.headers || {
            'Content-Type': contentType,
            'Content-Length': String(fileSize),
          },
        },
      },
    })
  } catch (error) {
    console.error('File init error:', error)
    return NextResponse.json(
      { error: 'Failed to init file upload', details: String(error) },
      { status: 500 }
    )
  }
}