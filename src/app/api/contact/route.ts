import { NextRequest, NextResponse } from 'next/server';

interface ContactBody {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactBody = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    let firestoreSaved = false;

    // Attempt to save to Firestore if Firebase is configured
    try {
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc, Timestamp } = await import('firebase/firestore');

      await addDoc(collection(db, 'contacts'), {
        name,
        email,
        subject,
        message,
        createdAt: Timestamp.fromDate(new Date()),
        read: false,
      });

      firestoreSaved = true;
    } catch {
      // Firebase not configured — fall back to environment logging
      console.log('Firebase not configured. Contact message:', { name, email, subject, message });
    }

    return NextResponse.json({
      success: true,
      firestoreSaved,
      message: 'Message received. We will get back to you soon.',
    });
  } catch (err) {
    console.error('Contact API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
