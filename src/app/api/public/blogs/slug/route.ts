import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/firestore-rest';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  try {
    const blogs = await getCollection('blogs');
    const post = blogs.find((b: any) => b.slug === slug && b.published !== false);
    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (err: any) {
    console.error('GET blog by slug error:', err);
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 });
  }
}
