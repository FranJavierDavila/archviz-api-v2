import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getUserByApiKey(apiKey: string) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();
  return error ? null : data;
}

export async function checkUserQuota(userId: string) {
  const { data } = await getSupabase()
    .from('users')
    .select('tokens_used, tokens_limit')
    .eq('id', userId)
    .single();
  if (!data) return { hasQuota: false, remaining: 0, used: 0, limit: 0 };
  const remaining = data.tokens_limit - data.tokens_used;
  return { hasQuota: remaining > 0, remaining, used: data.tokens_used, limit: data.tokens_limit };
}

export async function getAllUsers() {
  const { data } = await getSupabase().from('users').select('*');
  return data || [];
}

export async function updateUser(userId: string, updateData: Record<string, any>) {
  const { data, error } = await getSupabase()
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();
  return error ? { success: false, error: error.message } : { success: true, user: data };
}

export async function createUser(email: string, name: string, planId: string) {
  const plan = (await import('./api-types')).PLANS.find(p => p.id === planId);
  if (!plan) return { error: 'Plan no válido' };
  const apiKey = 'avpb_' + Math.random().toString(36).substring(2, 34);
  const { data, error } = await getSupabase()
    .from('users')
    .insert({ email, name, api_key: apiKey, plan_id: planId, tokens_used: 0, tokens_limit: plan.tokens_limit, is_active: true, requires_api_key: true })
    .select()
    .single();
  return error ? { error: error.message } : { user: data };
}