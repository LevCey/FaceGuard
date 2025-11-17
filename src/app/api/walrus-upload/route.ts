import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Multiple testnet publishers to try (in case one is out of WAL)
    const publishers = [
      'https://walrus-testnet-publisher.stakecraft.com',
      'https://walrus-testnet-publisher.nodeinfra.com',
      'https://publisher.walrus-testnet.walrus.space',
      'https://walrus-testnet-publisher.everstake.one',
      'https://sm1-walrus-testnet-publisher.stakesquid.com',
      'https://walrus-testnet-publisher.nodes.guru',
      'https://walrus-publisher-testnet.staketab.org',
      'https://walrus-testnet-publisher.stakely.io',
    ]

    const buffer = Buffer.from(await file.arrayBuffer())
    const epochs = 100 // Store for 100 epochs

    // Try each publisher until one succeeds
    for (const publisherUrl of publishers) {
      try {
        console.log(`[Backend] Trying publisher: ${publisherUrl}`)

        const response = await fetch(`${publisherUrl}/v1/store?epochs=${epochs}`, {
          method: 'PUT',
          body: buffer,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.warn(`[Backend] ${publisherUrl} failed:`, errorText)
          continue // Try next publisher
        }

        const result = await response.json()
        console.log('[Backend] Walrus upload response:', result)

        // Extract blob ID from response
        if (result.newlyCreated?.blobObject?.blobId) {
          return NextResponse.json({
            success: true,
            blobId: result.newlyCreated.blobObject.blobId,
            publisher: publisherUrl,
          })
        } else if (result.alreadyCertified?.blobId) {
          return NextResponse.json({
            success: true,
            blobId: result.alreadyCertified.blobId,
            publisher: publisherUrl,
            alreadyExists: true,
          })
        }
      } catch (error: any) {
        console.warn(`[Backend] Publisher ${publisherUrl} error:`, error.message)
        continue // Try next publisher
      }
    }

    // All publishers failed
    return NextResponse.json({
      success: false,
      error: 'All publishers failed',
      message: 'Walrus testnet publishers may be temporarily unavailable',
    }, { status: 503 })

  } catch (error) {
    console.error('[Backend] Walrus upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
