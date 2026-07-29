import { NextResponse } from 'next/server';
import { getDoc, updateDoc, deleteDoc } from '@/lib/firestore-rest';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDoc('blogs', id);
  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(doc);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.content !== undefined) data.content = body.content;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.categoryName !== undefined) data.categoryName = body.categoryName;
  if (body.published !== undefined) data.published = body.published;

  await updateDoc('blogs', id, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await deleteDoc('blogs', id);
  return NextResponse.json({ success: true });
}
