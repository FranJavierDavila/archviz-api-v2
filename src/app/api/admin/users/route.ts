import { NextResponse } from 'next/server';
import { getAllUsers, createUser, updateUser } from '@/lib/supabase';
import { PLANS } from '@/lib/api-types';

export const dynamic = 'force-dynamic';

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'admin123';

function auth(request: Request) {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === ADMIN_KEY;
}

export async function GET(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const users = await getAllUsers();
  return NextResponse.json({ success: true, users: users.map(u => ({ ...u, plan_name: PLANS.find(p => p.id === u.plan_id)?.name })) });
}

export async function POST(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { email, name, plan_id } = await request.json();
  const result = await createUser(email, name, plan_id);
  return result.error ? NextResponse.json({ error: result.error }, { status: 400 }) : NextResponse.json({ success: true, user: result.user });
}

export async function PATCH(request: Request) {
  if (!auth(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { user_id, requires_api_key, is_active } = await request.json();
  const data: Record<string, any> = {};
  if (requires_api_key !== undefined) data.requires_api_key = requires_api_key;
  if (is_active !== undefined) data.is_active = is_active;
  const result = await updateUser(user_id, data);
  return NextResponse.json(result);
}