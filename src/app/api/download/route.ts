import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url, format } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Missing required parameter: url.' }, { status: 400 });
    }

    // On Vercel/Python not available, redirect to source URL
    return NextResponse.json({
      taskId: 'fallback',
      status: 'completed',
      percent: 100,
      speed: '0 MB/s',
      eta: '00:00',
      url: url,
      format: format || 'best',
      fallbackUrl: url,
      message: 'Download directly from the source',
    });
  } catch (err: any) {
    console.error('Download API error:', err);
    return NextResponse.json({ error: 'Failed to initiate download.' }, { status: 500 });
  }
}
