import { NextResponse } from 'next/server';
import { activeTasks, startDownload, DownloadTask } from '@/lib/yt-dlp';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { url, format, title } = await request.json();

    if (!url || !format || !title) {
      return NextResponse.json({ error: 'Missing required parameters: url, format, and title are required.' }, { status: 400 });
    }

    const taskId = crypto.randomUUID();

    // Register task in the memory store
    const newTask: DownloadTask = {
      id: taskId,
      url,
      format,
      percent: 0,
      speed: '0 MB/s',
      eta: 'Starting...',
      status: 'pending',
    };

    activeTasks.set(taskId, newTask);

    // Kick off download asynchronously so client isn't blocked waiting for download to complete
    startDownload(taskId, url, format, title);

    return NextResponse.json({ taskId });
  } catch (err: any) {
    console.error('Download API error:', err);
    return NextResponse.json({ error: 'Failed to initiate download job.' }, { status: 500 });
  }
}
