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
  
  // Support Hugging Face, Gemini and Groq with prioritized fallback and Vercel environment safety
  const hfToken = (process.env.HF_TOKEN || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();

  if (!hfToken && !geminiKey && !groqKey) {
    return res.status(500).json({ error: 'La clave de API (HF_TOKEN, GEMINI_API_KEY o GROQ_API_KEY) no está configurada en las variables de entorno de Vercel.' });
  }

  // Query Google Places if key is configured and message matches search intent
  let mapsContext = "";
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const isSearchQuery = /(?:club|spa|local|sitio|hotel|donde|encuentra|buscar|mapa|swinger|liberal|evento|fiesta)/i.test(userMsg);
  
  if (mapsApiKey && isSearchQuery) {
    try {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(userMsg)}&key=${mapsApiKey}`;
      const mapsRes = await fetch(placesUrl);
      if (mapsRes.ok) {
        const mapsData = await mapsRes.json().catch(() => null);
        if (mapsData && mapsData.results && mapsData.results.length > 0) {
          mapsContext = "\n--- RESULTADOS DE GOOGLE MAPS EN TIEMPO REAL ---\n";
          mapsData.results.slice(0, 5).forEach((place, idx) => {
            mapsContext += `${idx + 1}. **${place.name}**\n`;
            mapsContext += `   Dirección: ${place.formatted_address || 'No disponible'}\n`;
            if (place.rating) {
              mapsContext += `   Calificación: ${place.rating} ⭐ (${place.user_ratings_total} reseñas)\n`;
            }
            if (place.business_status) {
              mapsContext += `   Estado: ${place.business_status === 'OPERATIONAL' ? 'Abierto y operativo' : 'Cerrado o inactivo'}\n`;
            }
          });
          mapsContext += "----------------------------------------------\n";
        }
      }
    } catch (e) {
      console.error("Google Places API error:", e);
    }
  }

  const systemPrompt = `Eres Shadow, el oráculo del swinging y asistente IA oficial de SwingerSphere — la plataforma premium de lifestyle en España y Latinoamérica.
Tu personalidad: cercano, sabio, discreto, informado, inclusivo y sin prejuicios. Usas emojis con moderación.
Respondes SIEMPRE en español. Eres el Oráculo Supremo del ambiente swinger y LGTBI+; eres un experto absoluto en: banderas del orgullo LGTBI+ y su historia/significado, además de prácticas BDSM, fetiches, relaciones abiertas, normas, booking de hoteles/viajes, y CRM de clubes.
Cuando te pregunten por clubes o spas nudistas: utiliza y cita las direcciones reales, horarios y valoraciones que recibas de Google Maps.
Cuando te pregunten por eventos de un club: indica qué eventos organiza (por ejemplo, noches temáticas de singles, fiestas de parejas VIP, etc.) buscando activamente la información o utilizando los datos disponibles en internet y en la base de conocimientos.
Cuando el usuario pregunte sobre pagar: la membresía PRO cuesta 9,99 EUR/mes. Métodos: tarjeta via Transak (convertida automáticamente a USDC) y USDC directo en redes Polygon, Arbitrum o Ethereum.
Cuando el usuario mencione una ciudad o viaje: recomienda hoteles, eventos y entradas del sistema de Booking con precios.
Cuando un club pregunte: ofrece planes CRM desde 40 EUR e insignia de Certificación.

Contexto relevante de tu base de conocimiento:
${context || 'Sin contexto específico'}
${mapsContext}

Responde de forma sabia, útil y concisa (máximo 3 párrafos).`;

  async function callHuggingFace(token) {
    const url = 'https://router.huggingface.co/v1/chat/completions';
    const models = [
      'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'Qwen/Qwen2.5-7B-Instruct',
      'meta-llama/Llama-3.1-8B-Instruct'
    ];
    
    const errorsList = [];
    for (const model of models) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMsg }
            ],
            temperature: 0.7,
            max_tokens: 600
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        } else {
          const errData = await response.json().catch(() => ({}));
          errorsList.push(`${model}: ${errData?.error?.message || `HTTP ${response.status}`}`);
        }
      } catch (e) {
        errorsList.push(`${model}: ${e.message}`);
      }
    }
    throw new Error(`[${errorsList.join(' | ')}]`);
  }

  async function callGemini(key) {
    const models = [
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-1.5-flash'
    ];
    const errorsList = [];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\nUsuario: ' + userMsg }] }],
            tools: [{ google_search: {} }], // Enable Live Google Search Grounding!
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
            safetySettings: [
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } else {
          const errData = await response.json().catch(() => ({}));
          errorsList.push(`${model}: ${errData?.error?.message || `HTTP ${response.status}`}`);
        }
      } catch (e) {
        errorsList.push(`${model}: ${e.message}`);
      }
    }
    throw new Error(`[${errorsList.join(' | ')}]`);
  }

  async function callGroq(key) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const models = [
      'llama-4-scout',
      'llama-4-maverick',
      'llama3-70b-8192',
      'llama-3.3-70b-versatile',
      'llama-3.3-70b-specdec',
      'llama-3.1-70b-versatile'
    ];
    
    const errorsList = [];
    for (const model of models) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMsg }
            ],
            temperature: 0.7,
            max_tokens: 600
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        } else {
          const errData = await response.json().catch(() => ({}));
          errorsList.push(`${model}: ${errData?.error?.message || `HTTP ${response.status}`}`);
        }
      } catch (e) {
        errorsList.push(`${model}: ${e.message}`);
      }
    }
    throw new Error(`[${errorsList.join(' | ')}]`);
  }

  let responseText = "";
  const errors = [];

  // Try Hugging Face first if defined (Option 2 — Free globally)
  if (hfToken) {
    try {
      responseText = await callHuggingFace(hfToken);
    } catch (e) {
      console.error("Hugging Face call failed, trying Gemini/Groq:", e);
      errors.push(`Hugging Face Error: ${e.message}`);
    }
  }

  // Fallback to Gemini
  if (!responseText && geminiKey) {
    try {
      responseText = await callGemini(geminiKey);
    } catch (e) {
      console.error("Gemini call failed, trying Groq as fallback:", e);
      errors.push(`Gemini Error: ${e.message}`);
    }
  }

  // Fallback to Groq
  if (!responseText && groqKey) {
    try {
      responseText = await callGroq(groqKey);
    } catch (e) {
      console.error("Groq call failed:", e);
      errors.push(`Groq Error: ${e.message}`);
    }
  }

  // If all failed or are not configured
  if (!responseText) {
    const combinedErrors = errors.length > 0 ? errors.join(' | ') : 'Sin claves válidas configuradas.';
    return res.status(500).json({
      error: `⚠️ Error de la IA en el Servidor: ${combinedErrors}. Comprueba que has configurado la variable de entorno HF_TOKEN en Vercel con el valor correcto y has hecho un Redeploy.`
    });
  }

  return res.status(200).json({ text: responseText });
}
