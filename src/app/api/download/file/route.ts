import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || searchParams.get('downloadUrl');

  if (url) {
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.json({ error: 'No download URL provided.' }, { status: 400 });
}
