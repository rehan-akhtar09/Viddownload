import { NextResponse } from 'next/server';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function GET() {
  const snap = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(cats);
}

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const docRef = await addDoc(collection(db, 'categories'), {
    name,
    slug,
    createdAt: serverTimestamp(),
  });

  return NextResponse.json({ id: docRef.id, name, slug, success: true });
}
