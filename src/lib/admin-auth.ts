import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');

export function verifyToken(token: string): { email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, sig] = parts;
    const expectedSig = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');

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

export { JWT_SECRET };
