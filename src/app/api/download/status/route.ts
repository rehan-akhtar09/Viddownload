import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { error: 'Download status polling is no longer used. Downloads complete in the POST /api/download request.' },
    { status: 410 },
  );
}
