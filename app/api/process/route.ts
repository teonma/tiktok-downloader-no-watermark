import { NextResponse } from 'next/server'
import SnapTikClient from '../../../lib/SnapTikClient'

export async function POST(request: Request) {
  const { url } = await request.json()

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const client = new SnapTikClient()
    const result = await client.process(url)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing URL:', error)
    return NextResponse.json({ error: 'Failed to process URL' }, { status: 500 })
  }
}

