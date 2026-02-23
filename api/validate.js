import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Configuración de CORS para evitar el error que viste en consola
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { api_key } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan, tokens_used, total_tokens')
      .eq('api_key', api_key)
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false, error: 'API Key inválida' });
    }

    const remaining = data.total_tokens - data.tokens_used;
    return res.status(200).json({
      success: true,
      plan: data.plan,
      tokens_remaining: remaining
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
}
