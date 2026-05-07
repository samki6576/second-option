import { NextRequest, NextResponse } from 'next/server'

type UploadRequest = {
  method?: 'PUT' | 'POST'
  url: string
  headers?: Record<string, string>
}

type FileEntry = {
  content_type?: string
  file_name?: string
  file_id?: string
  requests?: UploadRequest[]
}

function joinUrl(baseUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  return `${baseUrl.replace(/\/+$/, '')}/${pathOrUrl.replace(/^\/+/, '')}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contentType, fileName, fileSize } = body ?? {}

    if (!contentType || !fileName || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const baseUrl = process.env.PERFECT_CORP_API_URL ?? 'https://yce-api-01.makeupar.com'
    const apiKey = process.env.PERFECT_CORP_API_KEY ?? process.env.VITE_PERFECT_CORP_API_KEY
    const fileEndpoint = process.env.PERFECT_CORP_FILE_ENDPOINT ?? '/s2s/v2.0/file/makeup-vto'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'PERFECT_CORP_API_KEY is missing in server environment' },
        { status: 500 }
      )
    }

    const fileUrl = joinUrl(baseUrl, fileEndpoint)
    const initResponse = await fetch(fileUrl, {
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
      cache: 'no-store',
    })

    if (!initResponse.ok) {
      return NextResponse.json(
        { error: 'Perfect Corp file init failed', details: await initResponse.text() },
        { status: 502 }
      )
    }

    const payload = await initResponse.json()
    const fileEntry = payload?.data?.files?.[0] as FileEntry | undefined
    const upload = fileEntry?.requests?.[0]

    if (!fileEntry?.file_id || !upload?.url) {
      return NextResponse.json(
        { error: 'Perfect Corp file init response missing upload url or file_id', details: payload },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: fileEntry.file_id,
        upload: {
          method: upload.method ?? 'PUT',
          url: upload.url,
          headers: upload.headers ?? {
            'Content-Type': contentType,
            'Content-Length': String(fileSize),
          },
        },
      },
    })
  } catch (error) {
    console.error('Perfect Corp file-init error:', error)
    return NextResponse.json({ error: 'Failed to init file upload' }, { status: 500 })
  }
}

