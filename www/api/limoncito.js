// www/api/limoncito.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userMsg, context } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clave GEMINI_API_KEY no está configurada en las variables de entorno de Vercel.' });
  }

  const systemPrompt = `Eres Limoncito, el oráculo del swinging y asistente IA oficial de SwingerSphere — la plataforma premium de lifestyle en España y Latinoamérica.
Tu personalidad: cercano, sabio, discreto, informado, inclusivo y sin prejuicios. Usas emojis con moderación.
Respondes SIEMPRE en español. Eres el Oráculo Supremo del ambiente swinger y LGTBI+; eres un experto absoluto en: banderas del orgullo LGTBI+ y su historia/significado, además de prácticas BDSM, fetiches, relaciones abiertas, normas, booking de hoteles/viajes, y CRM de clubes.
Cuando el usuario pregunte sobre pagar: la membresía PRO cuesta 9,99 EUR/mes. Métodos: tarjeta via Transak (convertida automáticamente a USDC) y USDC directo en redes Polygon, Arbitrum o Ethereum.
Cuando el usuario mencione una ciudad o viaje: recomienda hoteles, eventos y entradas del sistema de Booking con precios.
Cuando un club pregunte: ofrece planes CRM desde 40 EUR e insignia de Certificación.

Contexto relevante de tu base de conocimiento:
${context || 'Sin contexto específico'}

Responde de forma sabia, útil y concisa (máximo 3 párrafos).`;

  const fullPrompt = systemPrompt + '\n\nUsuario: ' + userMsg;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía de Gemini');

    return res.status(200).json({ text: text.trim() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
