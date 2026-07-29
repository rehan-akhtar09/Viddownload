import { NextResponse } from 'next/server';

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views: number): string {
  if (!views) return '0';
  if (views >= 1_000_000_000) return (views / 1_000_000_000).toFixed(1).replace('.0', '') + 'B';
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1).replace('.0', '') + 'K';
  return views.toLocaleString();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Unknown';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  return dateStr;
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('m.youtube.com')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com') || u.includes('instagr.am')) return 'instagram';
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (u.includes('dailymotion.com') || u.includes('dai.ly')) return 'dailymotion';
  if (u.includes('twitch.tv')) return 'twitch';
  if (u.includes('reddit.com') || u.includes('redd.it')) return 'reddit';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('pinterest.com') || u.includes('pin.it')) return 'pinterest';
  if (u.includes('tumblr.com')) return 'tumblr';
  return 'unknown';
}

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function extractYouTube(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();

    const videoId = url.match(/(?:v=|youtu\.be\/|v\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1] || '';
    let duration = '00:00';
    let viewCount = '0';
    let uploadDate = 'Unknown';

    if (videoId) {
      try {
        const htmlRes = await fetchWithTimeout(`https://www.youtube.com/watch?v=${videoId}`, 3000);
        const html = await htmlRes.text();
        const durationMatch = html.match(/"approxDurationMs":"(\d+)"/);
        if (durationMatch) duration = formatDuration(Math.floor(parseInt(durationMatch[1]) / 1000));
        const viewMatch = html.match(/"viewCount":"(\d+)"/);
        if (viewMatch) viewCount = formatViews(parseInt(viewMatch[1]));
        const dateMatch = html.match(/"uploadDate":"([^"]+)"/);
        if (dateMatch) uploadDate = formatDate(dateMatch[1]);
      } catch {}
    }

    return {
      title: data.title || 'YouTube Video',
      channel: data.author_name || 'Unknown',
      duration,
      uploadDate,
      viewCount,
      thumbnail: data.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''),
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: false,
    };
  } catch {
    return null;
  }
}

async function extractTikTok(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();

    let duration = '00:00';
    if (data.duration) duration = formatDuration(data.duration);

    return {
      title: data.title || (data.author_name ? `TikTok by ${data.author_name}` : 'TikTok Video'),
      channel: data.author_name || 'Unknown',
      duration,
      uploadDate: data.upload_date || formatDate(data.upload_date || ''),
      viewCount: '0',
      thumbnail: data.thumbnail_url || data.thumbnail || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: true,
    };
  } catch {
    return null;
  }
}

async function extractInstagram(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://www.instagram.com/oembed?url=${encodeURIComponent(url)}`);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();

    return {
      title: data.title || 'Instagram Video',
      channel: data.author_name || 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: data.thumbnail_url || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: true,
    };
  } catch {
    return null;
  }
}

async function extractFacebook(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://graph.facebook.com/v19.0/oembed_video?url=${encodeURIComponent(url)}&format=json`);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();
    return {
      title: data.title || 'Facebook Video',
      channel: data.author_name || 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: data.thumbnail_url || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: false,
    };
  } catch {
    return null;
  }
}

async function extractVimeo(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();
    return {
      title: data.title || 'Vimeo Video',
      channel: data.author_name || 'Unknown',
      duration: formatDuration(data.duration || 0),
      uploadDate: formatDate(data.upload_date || ''),
      viewCount: formatViews(data.view_count || 0),
      thumbnail: data.thumbnail_url || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: false,
    };
  } catch {
    return null;
  }
}

async function extractTwitter(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
    if (!oembedRes.ok) throw new Error('oembed failed');
    const data = await oembedRes.json();
    return {
      title: data.title || data.author_name || 'X/Twitter Video',
      channel: data.author_name || 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: data.thumbnail_url || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: true,
    };
  } catch {
    return null;
  }
}

async function extractDailymotion(url: string) {
  try {
    const videoId = url.match(/(?:video|dai\.ly)\/([a-zA-Z0-9]+)/)?.[1];
    if (!videoId) throw new Error('no id');
    const apiRes = await fetchWithTimeout(`https://api.dailymotion.com/video/${videoId}?fields=title,owner.screenname,duration,views_total,thumbnail_url,created_time`);
    if (!apiRes.ok) throw new Error('api failed');
    const data = await apiRes.json();
    return {
      title: data.title || 'Dailymotion Video',
      channel: data.owner?.screenname || 'Unknown',
      duration: formatDuration(data.duration || 0),
      uploadDate: data.created_time ? formatDate(new Date(data.created_time * 1000).toISOString()) : 'Unknown',
      viewCount: formatViews(data.views_total || 0),
      thumbnail: data.thumbnail_url || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: false,
    };
  } catch {
    return null;
  }
}

async function extractNoembed(url: string) {
  try {
    const oembedRes = await fetchWithTimeout(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (!oembedRes.ok) throw new Error('noembed failed');
    const data = await oembedRes.json();
    if (data.error) throw new Error(data.error);
    return {
      title: data.title || 'Video',
      channel: data.author_name || 'Unknown',
      duration: '00:00',
      uploadDate: 'Unknown',
      viewCount: '0',
      thumbnail: data.thumbnail_url || '',
      url,
      availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
      isShort: false,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error();
    } catch {
      return NextResponse.json({ error: 'Invalid URL. Please enter a valid video link.' }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const platform = detectPlatform(cleanUrl);

    let result = null;

    if (platform === 'youtube') result = await extractYouTube(cleanUrl);
    else if (platform === 'tiktok') result = await extractTikTok(cleanUrl);
    else if (platform === 'instagram') result = await extractInstagram(cleanUrl);
    else if (platform === 'facebook') result = await extractFacebook(cleanUrl);
    else if (platform === 'vimeo') result = await extractVimeo(cleanUrl);
    else if (platform === 'twitter') result = await extractTwitter(cleanUrl);
    else if (platform === 'dailymotion') result = await extractDailymotion(cleanUrl);

    if (!result) result = await extractNoembed(cleanUrl);

    if (!result) {
      return NextResponse.json({
        title: cleanUrl,
        channel: 'Unknown',
        duration: '00:00',
        uploadDate: 'Unknown',
        viewCount: '0',
        thumbnail: '',
        url: cleanUrl,
        availableQualities: { '360p': true, '480p': true, '720p': true, '1080p': true, 'highest' : true },
        isShort: false,
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Analyze API error:', err);
    return NextResponse.json({ error: 'Failed to analyze video. Please check the URL and try again.' }, { status: 500 });
  }
}
