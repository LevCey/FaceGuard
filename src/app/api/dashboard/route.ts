import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const mockRegistrations = [
      {
        id: '1',
        faceHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
        registrationDate: Date.now() - 86400000 * 7,
        nftId: '0x1234567890abcdef',
      },
    ]

    const mockAlerts = [
      {
        id: '1',
        url: 'https://example.com/suspicious-profile',
        similarity: 87,
        detectedAt: Date.now() - 3600000,
        status: 'new' as const,
        platform: 'Instagram',
      },
    ]

    return NextResponse.json({
      registrations: mockRegistrations,
      alerts: mockAlerts,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    )
  }
}
