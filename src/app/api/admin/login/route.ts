import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function signToken(email: string) {
  const secret = requireEnv('JWT_SECRET');
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  })).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export async function POST(request: Request) {
  try {
    const ADMIN_EMAIL = requireEnv('ADMIN_EMAIL');
    const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server configuration error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
