import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await getDoc(doc(db, 'blogs', id));
  if (!snap.exists()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (body.title !== undefined) data.title = body.title;
  if (body.slug !== undefined) data.slug = body.slug;
  if (body.content !== undefined) data.content = body.content;
  if (body.excerpt !== undefined) data.excerpt = body.excerpt;
  if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  if (body.categoryName !== undefined) data.categoryName = body.categoryName;
  if (body.published !== undefined) data.published = body.published;

  await updateDoc(doc(db, 'blogs', id), data);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await deleteDoc(doc(db, 'blogs', id));
  return NextResponse.json({ success: true });
}
