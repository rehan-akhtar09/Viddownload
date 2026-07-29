import { NextResponse } from 'next/server';

const { apiKey, authDomain } = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
};

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      if (data.error?.message === 'EMAIL_EXISTS') {
        return NextResponse.json({
          success: true,
          message: 'Admin account already exists. You can log in at /admin/login',
        });
      }
      if (data.error?.message?.includes('MISSING_SIGNIN')) {
        return NextResponse.json({
          error: 'Email/Password sign-in is not enabled. Please enable it in Firebase Console:',
          console: 'https://console.firebase.google.com/project/video-downloader-3dad3/authentication/users',
          fix: 'Go to Authentication > Sign-in method > Email/Password and enable it.',
        }, { status: 400 });
      }
      return NextResponse.json({ error: data.error?.message || 'Sign up failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created. Go to /admin/login to sign in.',
      email: data.email,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
