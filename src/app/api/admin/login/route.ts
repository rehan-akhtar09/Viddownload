import { NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rehan.ibex04@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '__ADMIN_PASSWORD__';
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');

function signToken(email: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  })).toString('base64url');
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signToken(email);

  return NextResponse.json({
    success: true,
    token,
    user: { email },
  });
}
