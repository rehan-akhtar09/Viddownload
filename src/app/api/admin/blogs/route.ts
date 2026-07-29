import { NextResponse } from 'next/server';
import { getCollection, addDoc } from '@/lib/firestore-rest';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function GET() {
  try {
    const blogs = await getCollection('blogs');
    return NextResponse.json(blogs);
  } catch (err: any) {
    console.error('GET blogs error:', err);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.title || !body.slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    const id = await addDoc('blogs', {
      title: body.title,
      slug: body.slug,
      content: body.content || '',
      excerpt: body.excerpt || body.title,
      categoryId: body.categoryId || null,
      categoryName: body.categoryName || null,
      published: body.published ?? true,
      author: 'admin',
    });

    return NextResponse.json({ id, success: true });
  } catch (err: any) {
    console.error('POST blog error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create blog' }, { status: 500 });
  }
}
