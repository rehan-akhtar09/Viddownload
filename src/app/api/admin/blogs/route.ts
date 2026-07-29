import { NextResponse } from 'next/server';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyToken, getTokenFromRequest } from '@/lib/admin-auth';

export async function GET() {
  const snap = await getDocs(query(collection(db, 'blogs'), orderBy('createdAt', 'desc')));
  const blogs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(blogs);
}

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.slug) {
    return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
  }

  const data = {
    title: body.title,
    slug: body.slug,
    content: body.content || '',
    excerpt: body.excerpt || body.title,
    categoryId: body.categoryId || null,
    categoryName: body.categoryName || null,
    published: body.published ?? true,
    author: 'admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'blogs'), data);
  return NextResponse.json({ id: docRef.id, success: true });
}
