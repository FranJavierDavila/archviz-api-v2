import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UsageLog, PLANS } from './api-types';

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as User;
}

export async function checkUserQuota(userId: string): Promise<{ canUse: boolean; remaining: number; used: number; limit: number }> {
  const supabase = getSupabase();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('tokens_used, tokens_limit, plan_id')
    .eq('id', userId)
    .single();
  
  if (error || !user) {
    return { canUse: false, remaining: 0, used: 0, limit: 0 };
  }
  
  const used = user.tokens_used || 0;
  const limit = user.tokens_limit || 0;
  
  // -1 means unlimited
  if (limit === -1) {
    return { canUse: true, remaining: -1, used, limit: -1 };
  }
  
  const remaining = Math.max(0, limit - used);
  const canUse = remaining > 0;
  
  return { canUse, remaining, used, limit };
}

export async function incrementTokenUsage(userId: string, tokens: number): Promise<void> {
  const supabase = getSupabase();
  
  await supabase.rpc('increment_tokens', {
    user_id: userId,
    token_amount: tokens
  }).catch(async () => {
    // Fallback if RPC doesn't exist
    const { data: user } = await supabase
      .from('users')
      .select('tokens_used')
      .eq('id', userId)
      .single();
    
    if (user) {
      await supabase
        .from('users')
        .update({ tokens_used: (user.tokens_used || 0) + tokens })
        .eq('id', userId);
    }
  });
}

export async function logUsage(userId: string, endpoint: string, tokensUsed: number): Promise<void> {
  const supabase = getSupabase();
  
  await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      endpoint,
      tokens_used: tokensUsed
    });
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return (data || []) as User[];
}

export async function updateUserRequiresApiKey(userId: string, requiresApiKey: boolean): Promise<boolean> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('users')
    .update({ requires_api_key: requiresApiKey, updated_at: new Date().toISOString() })
    .eq('id', userId);
  
  return !error;
}

export async function createUser(email: string, planId: string, requiresApiKey: boolean = true): Promise<User | null> {
  const supabase = getSupabase();
  
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];
  const apiKey = `ak_${generateRandomKey()}`;
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      api_key: apiKey,
      plan_id: planId,
      tokens_limit: plan.tokensLimit,
      tokens_used: 0,
      is_active: true,
      requires_api_key: requiresApiKey
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user:', error);
    return null;
  }
  
  return data as User;
}

function generateRandomKey(): string {
  return Array.from({ length: 32 }, () => 
    'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))
  ).join('');
}
