import { NextResponse } from 'next/server';
import { activeTasks } from '@/lib/yt-dlp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId query parameter.' }, { status: 400 });
  }

  const task = activeTasks.get(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Download task not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: task.id,
    percent: task.percent,
    speed: task.speed,
    eta: task.eta,
    status: task.status,
    error: task.error,
  });
}
