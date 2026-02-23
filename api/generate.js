// En tu archivo api/generate.js añade esto al principio:
res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
}
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { api_key, prompt_data, engine } = req.body;

  // 1. Buscar usuario por API Key
// 1. Cuando busques al usuario, usa los alias para tus columnas reales
const { data: user, error: userError } = await supabase
  .from('users')
  .select('plan:plan_id, tokens_used, total_tokens:max_tokens') // <--- CLAVE: Tus nombres reales
  .eq('api_key', api_key)
  .single();

if (userError || !user) {
  return res.status(401).json({ success: false, error: 'API Key inválida' });
}

// 2. Verificar si le quedan tokens
if (user.tokens_used >= user.total_tokens) {
  return res.status(403).json({ success: false, error: 'Has agotado tus tokens' });
}

  // 3. Lógica de Prompt (Simplificada, puedes expandirla)
  const finalPrompt = `Professional architecture, ${prompt_data.scene}, high quality --v 6.1`;

  // 4. Actualización: Sumar uso y Crear Log
// 4. Al final, cuando descuentes el token, usa el nombre de columna correcto
const { error: updateError } = await supabase
  .from('users')
  .update({ tokens_used: user.tokens_used + 1 }) // 'tokens_used' sí se llama así en tu base
  .eq('api_key', api_key);

  await supabase.from('usage_logs').insert([
    { user_id: user.id, tokens_used: 1, action: `Generated ${engine} prompt` }
  ]);

  return res.status(200).json({
    success: true,
    prompt: finalPrompt,
    negative_prompt: "low quality, blurry",
    tokens_remaining: user.max_tokens - (user.tokens_used + 1),
    plan: user.plan_id
  });

}


