import { createHmac, timingSafeEqual } from 'crypto';

let _jwtSecret: string | null = null;

function getJwtSecret(): string {
  if (!_jwtSecret) {
    _jwtSecret = process.env.JWT_SECRET || '';
    if (!_jwtSecret) throw new Error('Missing required env var: JWT_SECRET');
  }
  return _jwtSecret;
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const secret = getJwtSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, sig] = parts;
    const expectedSig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');

    if (sig.length !== expectedSig.length) return null;

    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;

    return { email: data.email };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}
