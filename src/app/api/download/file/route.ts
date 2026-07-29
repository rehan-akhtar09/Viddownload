import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is no longer used. Start downloads with POST /api/download.' },
    { status: 410 },
  );
}
