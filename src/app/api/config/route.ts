import { NextResponse } from 'next/server';
import { getApiKey, getNetApiBaseUrl } from '@/lib/config';

export async function GET() {
  const apiKey = getApiKey();
  const apiBaseUrl = getNetApiBaseUrl();

  return NextResponse.json({
    hasToken: !!apiKey,
    apiKey,
    apiBaseUrl,
  });
}
