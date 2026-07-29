import { NextResponse } from 'next/server';
import { getCollection, addDoc } from '@/lib/firestore-rest';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function GET() {
  try {
    const cats = await getCollection('categories');
    return NextResponse.json(cats);
  } catch (err: any) {
    console.error('GET categories error:', err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const id = await addDoc('categories', { name, slug });
    return NextResponse.json({ id, name, slug, success: true });
  } catch (err: any) {
    console.error('POST category error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create category' }, { status: 500 });
  }
}
