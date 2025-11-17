import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alertId = params.id

    console.log(`Takedown request initiated for alert ${alertId}`)

    return NextResponse.json({
      success: true,
      message: 'Takedown request submitted',
      alertId,
    })
  } catch (error) {
    console.error('Takedown error:', error)
    return NextResponse.json(
      { error: 'Takedown request failed' },
      { status: 500 }
    )
  }
}
