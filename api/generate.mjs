import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { api_key, prompt_data } = req.body;

  try {
    // 1. Validar usuario y ver si tiene tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('plan:plan_id, tokens_used, total:max_tokens')
      .eq('api_key', api_key)
      .single();

    if (userError || !user) {
      return res.status(401).json({ success: false, error: 'API Key inválida' });
    }

    if (user.tokens_used >= user.total) {
      return res.status(403).json({ success: false, error: 'Tokens agotados' });
    }

    // 2. CONSTRUIR EL PROMPT (Aquí es donde "fabricamos" la frase)
    // Juntamos los valores que vienen del formulario
    const partes = [
      prompt_data.estilo,
      prompt_data.vista,
      prompt_data.sujeto,
      prompt_data.iluminacion,
      prompt_data.clima,
      prompt_data.materiales,
      prompt_data.detalles,
      prompt_data.render
    ].filter(Boolean); // Esto elimina los campos que estén vacíos

    const promptFinal = partes.join(", ");
    const negativePrompt = "blurry, low quality, distorted, watermark";

    // 3. Descontar el token en Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ tokens_used: user.tokens_used + 1 })
      .eq('api_key', api_key);

    if (updateError) throw updateError;

    // 4. Enviar la respuesta a la web
    res.status(200).json({
      success: true,
      prompt: promptFinal,
      negative_prompt: negativePrompt,
      tokens_remaining: user.total - (user.tokens_used + 1),
      plan: user.plan
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
