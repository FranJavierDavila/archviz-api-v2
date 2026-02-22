import { NextResponse } from 'next/server';
import { getUserByApiKey, checkUserQuota } from '@/lib/supabase';
import { PLANS } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { api_key } = await request.json();
    
    if (!api_key) {
      return NextResponse.json({ success: false, error: 'API Key requerida' }, { status: 400 });
    }

    const user = await getUserByApiKey(api_key);
    if (!user) {
      return NextResponse.json({ success: false, error: 'API Key no válida' }, { status: 401 });
    }

    const quota = await checkUserQuota(user.id);
    const plan = PLANS.find(p => p.id === user.plan_id);

    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        name: user.name,
        plan: plan?.name || user.plan_id,
        tokens_used: quota.used,
        tokens_limit: quota.limit,
        tokens_remaining: quota.remaining,
        requires_api_key: user.requires_api_key ?? true
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}