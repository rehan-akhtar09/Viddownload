import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL. Please enter a valid video link.' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      return NextResponse.json({ error: 'Invalid URL. Please enter a valid video link.' }, { status: 400 });
    }

    const cleanUrl = url.trim();
    let title = 'Unknown Video';
    let channel = 'Unknown Channel';
    let thumbnail = '';
    let duration = 0;

    // Try oembed for video metadata
    try {
      const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(cleanUrl)}`;
      const oembedRes = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
      const oembedData = await oembedRes.json();
      if (oembedData.title) title = oembedData.title;
      if (oembedData.author_name) channel = oembedData.author_name;
      if (oembedData.thumbnail_url) thumbnail = oembedData.thumbnail_url;
      if (oembedData.provider_name) channel = oembedData.provider_name + (channel ? ' - ' + channel : '');
    } catch {
      // oembed failed, use URL-based fallback
      try {
        const hostname = parsed.hostname.toLowerCase();
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
          const vidId = hostname.includes('youtu.be')
            ? parsed.pathname.slice(1).split('?')[0]
            : parsed.searchParams.get('v');
          if (vidId) {
            thumbnail = `https://img.youtube.com/vi/${vidId}/maxresdefault.jpg`;
          }
        }
        if (hostname.includes('vimeo.com')) {
          thumbnail = 'https://i.vimeocdn.com/video/default';
        }
      } catch {}
    }

    return NextResponse.json({
      title,
      channel,
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail,
      url: cleanUrl,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest': true },
      isShort: false,
    });
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return NextResponse.json({ error: 'Failed to analyze video. Please check the URL and try again.' }, { status: 500 });
  }
}
