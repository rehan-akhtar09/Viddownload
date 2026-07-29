import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/firestore-rest';

export async function GET() {
  try {
    const blogs = await getCollection('blogs');
    const published = blogs.filter((b: any) => b.published !== false);
    return NextResponse.json(published);
  } catch (err: any) {
    console.error('GET public blogs error:', err);
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
  }
}
