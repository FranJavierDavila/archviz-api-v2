import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Manejo de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verificar que las variables existen
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ success: false, error: 'Faltan variables de entorno en Vercel' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { api_key } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('plan:plan_id, tokens_used, total_tokens')
      .eq('api_key', api_key)
      .maybeSingle(); // Usamos maybeSingle para que no explote si no hay nada

    if (error) throw error;

    if (!data) {
      return res.status(401).json({ success: false, error: 'API Key no encontrada en la base de datos' });
    }

    res.status(200).json({
      success: true,
      plan: data.plan,
      tokens_remaining: data.total_tokens - data.tokens_used
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error interno: ' + err.message });
  }
}
