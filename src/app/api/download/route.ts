import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import { downloadVideo } from '@/lib/yt-dlp';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  let cleanupDir: string | undefined;

  try {
    const body = await request.json() as { url?: unknown; format?: unknown; title?: unknown };
    if (typeof body.url !== 'string' || !body.url.trim()) {
      return NextResponse.json({ error: 'Missing required parameter: url.' }, { status: 400 });
    }

    const url = body.url.trim();
    const format = typeof body.format === 'string' ? body.format : 'video-highest';
    const title = typeof body.title === 'string' ? body.title : 'video';

    const file = await downloadVideo(url, format, title);
    cleanupDir = file.directory;

    const buffer = await fs.readFile(file.filePath);
    const encodedFileName = encodeURIComponent(file.fileName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.fileName}"; filename*=UTF-8''${encodedFileName}`,
        'Content-Length': String(file.size),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download this media.';
    console.error('Download API error:', message);
    return NextResponse.json({ error: message }, { status: 422 });
  } finally {
    if (cleanupDir) {
      fs.rm(cleanupDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
