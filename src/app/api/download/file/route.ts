import { activeTasks } from '@/lib/yt-dlp';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return new Response('Missing taskId parameter.', { status: 400 });
    }

    const task = activeTasks.get(taskId);

    if (!task || task.status !== 'completed' || !task.filePath) {
      return new Response('File not found or download task is not complete.', { status: 404 });
    }

    const { filePath, fileName, format } = task;

    if (!fs.existsSync(filePath)) {
      return new Response('The requested file is no longer available on the server.', { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const isAudio = format.startsWith('audio-');
    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
    const fallbackFileName = isAudio ? 'download.mp3' : 'download.mp4';

    // Register cleanup callback on stream close
    fileStream.on('close', () => {
      try {
        const dir = path.dirname(filePath);
        // Wait a brief delay to ensure Windows releases file handle completely
        setTimeout(() => {
          try {
            if (fs.existsSync(dir)) {
              fs.rmSync(dir, { recursive: true, force: true });
              console.log(`Cleaned up temp files for task ${taskId}`);
            }
            activeTasks.delete(taskId);
          } catch (cleanupErr) {
            console.error(`Failed to clean up temp files on delayed run for task ${taskId}:`, cleanupErr);
          }
        }, 1000);
      } catch (e) {
        console.error('Error during cleanup initialization:', e);
      }
    });

    // Convert Node.js Readable stream into Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        fileStream.on('end', () => {
          controller.close();
        });
        fileStream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        fileStream.destroy();
      }
    });

    // Serve as attachment download
    return new Response(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName || fallbackFileName)}`,
        'Content-Length': stats.size.toString(),
      }
    });
  } catch (err: unknown) {
    console.error('File delivery API error:', err);
    return new Response('An error occurred while serving the file.', { status: 500 });
  }
}
