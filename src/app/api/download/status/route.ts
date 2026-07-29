import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId query parameter.' }, { status: 400 });
  }

  // Return completed immediately for fallback mode
  return NextResponse.json({
    id: taskId,
    percent: 100,
    speed: '0 MB/s',
    eta: '00:00',
    status: 'completed',
  });
}
