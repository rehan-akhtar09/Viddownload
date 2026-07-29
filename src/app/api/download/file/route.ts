import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { activeTasks } from '@/lib/yt-dlp';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: 'Missing taskId parameter.' }, { status: 400 });
  }

  const task = activeTasks.get(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Download task not found or has expired.' }, { status: 404 });
  }

  if (task.status !== 'completed' || !task.filePath || !fs.existsSync(task.filePath)) {
    return NextResponse.json({ error: 'File is not ready or has been cleaned up.' }, { status: 400 });
  }

  const filePath = task.filePath;
  const fileName = task.fileName || 'video.mp4';
  const fileStats = fs.statSync(filePath);

  // Set response headers to force download as an attachment with file size
  const headers = new Headers();
  const encodedName = encodeURIComponent(fileName);
  headers.set('Content-Disposition', `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`);

  const isAudio = fileName.toLowerCase().endsWith('.mp3');
  headers.set('Content-Type', isAudio ? 'audio/mpeg' : 'video/mp4');
  headers.set('Content-Length', fileStats.size.toString());

  // Wrap the node file stream in a standard ReadableStream so Next.js can stream it
  const fileStream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        controller.enqueue(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength));
      });
      fileStream.on('end', () => {
        controller.close();
        // Clean up: delete the temporary folder containing the file and remove from map
        try {
          fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
          activeTasks.delete(taskId);
        } catch (err) {
          console.error('Error cleaning up temp directory after streaming:', err);
        }
      });
      fileStream.on('error', (err) => {
        controller.error(err);
        try {
          fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
          activeTasks.delete(taskId);
        } catch (e) {
          console.error('Error cleaning up temp directory on stream error:', e);
        }
      });
    },
    cancel() {
      fileStream.destroy();
      try {
        fs.rmSync(path.dirname(filePath), { recursive: true, force: true });
        activeTasks.delete(taskId);
      } catch (err) {
        console.error('Error cleaning up temp directory on stream cancel:', err);
      }
    }
  });

  return new Response(webStream, { headers });
}
