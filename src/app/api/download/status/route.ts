import { NextResponse } from 'next/server';
import { activeTasks } from '@/lib/yt-dlp';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId query parameter.' }, { status: 400 });
    }

    const task = activeTasks.get(taskId);

    if (!task) {
      return NextResponse.json({ error: 'Task not found or expired.' }, { status: 404 });
    }

    // Return the current task status
    return NextResponse.json(task);
  } catch (err: any) {
    console.error('Status API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve task status.' }, { status: 500 });
  }
}
