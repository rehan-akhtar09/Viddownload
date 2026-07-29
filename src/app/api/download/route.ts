import fs from 'fs';
import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { downloadVideo } from '@/lib/yt-dlp';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      url?: unknown;
      format?: unknown;
      title?: unknown;
    };

    if (typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Missing required parameter: url.' }, { status: 400 });
    }
    if (typeof body.format !== 'string') {
      return NextResponse.json({ error: 'Missing required parameter: format.' }, { status: 400 });
    }

    const downloaded = await downloadVideo(
      body.url,
      body.format,
      typeof body.title === 'string' ? body.title : 'video',
    );

    const fileStream = fs.createReadStream(downloaded.filePath);
    const cleanup = () => {
      void fs.promises.rm(downloaded.directory, { recursive: true, force: true }).catch((error) => {
        console.error('Temporary download cleanup failed:', error);
      });
    };
    fileStream.once('close', cleanup);

    const encodedName = encodeURIComponent(downloaded.fileName);
    const extension = downloaded.fileName.match(/\.[a-z0-9]+$/i)?.[0] || '';
    return new Response(Readable.toWeb(fileStream) as ReadableStream, {
      headers: {
        'Content-Type': downloaded.contentType,
        'Content-Length': downloaded.size.toString(),
        'Content-Disposition': `attachment; filename="download${extension}"; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to download this media.';
    console.error('Download API error:', message);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
