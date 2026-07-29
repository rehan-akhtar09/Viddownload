import { NextResponse } from 'next/server';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await deleteDoc(doc(db, 'categories', id));
  return NextResponse.json({ success: true });
}
