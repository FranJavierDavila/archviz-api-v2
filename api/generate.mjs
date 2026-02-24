import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { api_key } = req.body;

  try {
    // 1. Validar usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan:plan_id, tokens_used, total:max_tokens')
      .eq('api_key', api_key)
      .single();

    if (userError || !user) return res.status(401).json({ success: false, error: 'API Key inválida' });
    if (user.tokens_used >= user.total) return res.status(403).json({ success: false, error: 'Tokens agotados' });

    // 2. Descontar el token
    const { error: updateError } = await supabase
      .from('users')
      .update({ tokens_used: user.tokens_used + 1 })
      .eq('api_key', api_key);

    if (updateError) throw updateError;

    // 3. Responder OK
    res.status(200).json({
      success: true,
      tokens_remaining: user.total - (user.tokens_used + 1),
      plan: user.plan
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
