import { NextRequest, NextResponse } from 'next/server';
import { getUserByApiKey, checkUserQuota } from '@/lib/supabase';
import { ValidateResponse } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { api_key } = body;

    if (!api_key) {
      return NextResponse.json<ValidateResponse>({
        valid: false,
        error: 'API key is required'
      }, { status: 400 });
    }

    const user = await getUserByApiKey(api_key);

    if (!user) {
      return NextResponse.json<ValidateResponse>({
        valid: false,
        error: 'Invalid API key'
      }, { status: 401 });
    }

    const quota = await checkUserQuota(user.id);

    return NextResponse.json<ValidateResponse>({
      valid: true,
      plan: user.plan_id,
      tokens_used: quota.used,
      tokens_limit: quota.limit,
      requires_api_key: user.requires_api_key,
      remaining: quota.remaining
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json<ValidateResponse>({
      valid: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
