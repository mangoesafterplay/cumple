import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new NextResponse('Missing url', { status: 400 });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!response.ok) return new NextResponse('Forbidden', { status: 403 });

  const blob = await response.blob();
  return new NextResponse(blob, {
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
