import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maximumSizeInBytes: 10 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
