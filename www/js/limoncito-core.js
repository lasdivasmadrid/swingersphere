/* ===========================================================
   LIMONCITO™ AI CORE v2.0
   5-Layer Architecture: LLM → KB → RAG → Community → Concierge
   =========================================================== */
'use strict';

// ═══════════════════════════════════════════════════
// LAYER 1: LLM ADAPTER (Gemini Flash / OpenAI)
// ═══════════════════════════════════════════════════
const LimocitoLLM = (() => {
  const CFG_KEY_PROV = 'lmcito_provider';
  const CFG_KEY_KEY  = 'lmcito_apikey';

  function getConfig() {
    return {
      provider: localStorage.getItem(CFG_KEY_PROV) || 'gemini',
      apiKey:   localStorage.getItem(CFG_KEY_KEY)  || '',
    };
  }

  function setConfig(provider, apiKey) {
    localStorage.setItem(CFG_KEY_PROV, provider);
    localStorage.setItem(CFG_KEY_KEY,  apiKey);
  }

  async function callGemini(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        safetySettings: [
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text.trim();
  }

  async function callOpenAI(apiKey, prompt) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500, temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from OpenAI');
    return text.trim();
  }

  function generateSimulatedResponse(userMsg, context) {
    const q = (userMsg || '').toLowerCase();
    
    // 1. Clean and tokenize query into keywords
    const stopWords = new Set(['de','la','en','el','y','o','para','con','un','una','unos','unas','los','las','del','al','a','es','son','como','que','por','su','sus','tu','tus','me','te','se','lo','debes','tener','sobre']);
    const tokens = q.split(/[^a-záéíóúñ]+/i)
      .map(w => w.trim())
      .filter(w => w.length > 2 && !stopWords.has(w));
      
    // 2. Score articles in the global LIMONCITO_KB
    let bestDoc = null;
    let maxScore = 0;
    const relatedDocs = [];
    
    // Merge all KB articles from all loaded files/categories
    const allDocs = [];
    if (typeof LIMONCITO_KB !== 'undefined') {
      for (const cat in LIMONCITO_KB) {
        if (Array.isArray(LIMONCITO_KB[cat])) {
          LIMONCITO_KB[cat].forEach(doc => {
            allDocs.push({ ...doc, category: cat });
          });
        }
      }
    }
    
    if (tokens.length > 0) {
      allDocs.forEach(doc => {
        let score = 0;
        const titleL = (doc.title || '').toLowerCase();
        const contentL = (doc.content || '').toLowerCase();
        const tags = doc.tags || [];
        
        tokens.forEach(token => {
          // Exact tag match gets very high score
          tags.forEach(tag => {
            const tagL = (tag || '').toLowerCase();
            if (tagL === token) score += 10;
            else if (tagL.includes(token)) score += 4;
          });
          
          // Match in title
          if (titleL.includes(token)) {
            score += 6;
          }
          
          // Match in content
          const occurrences = contentL.split(token).length - 1;
          score += occurrences * 1;
        });
        
        if (score > 0) {
          doc._score = score;
          relatedDocs.push(doc);
        }
      });
    }
    
    // Sort matched documents by highest score descending
    relatedDocs.sort((a, b) => b._score - a._score);
    if (relatedDocs.length > 0) {
      bestDoc = relatedDocs[0];
      maxScore = bestDoc._score;
    }
    
    // 3. Generate intro
    const intros = [
      "¡Hola! Qué excelente consulta. Aquí tienes la información detallada sobre este tema: ",
      "Hola. Como tu asistente IA de SwingerSphere, te explico a fondo sobre esto: ",
      "¡Hola! Encantado de guiarte en el lifestyle. Aquí tienes los detalles clave: ",
      "Hola, claro que sí. En el ambiente lifestyle y BDSM es fundamental saber esto: "
    ];
    const intro = intros[Math.floor(Math.random() * intros.length)];
    
    // 4. Check for city / location matching in BOOKING_LISTINGS
    let bookingRecs = "";
    if (window.BOOKING_LISTINGS) {
      // Extract unique city names from listings
      const cities = [...new Set(window.BOOKING_LISTINGS.map(l => l.location.split(',')[0].trim().toLowerCase()))];
      let matchedCity = null;
      for (const city of cities) {
        if (q.includes(city)) {
          matchedCity = city;
          break;
        }
      }
      
      if (matchedCity) {
        const matches = window.BOOKING_LISTINGS.filter(l => l.location.toLowerCase().includes(matchedCity));
        if (matches.length > 0) {
          bookingRecs = `\n\n📌 **Recomendaciones en ${matchedCity.toUpperCase()} (disponibles en Booking):**\n` +
            matches.slice(0, 3).map(l => `• **${l.image} ${l.name}** (${l.location}): desde ${l.price}€ / ${l.priceUnit}.`).join('\n') +
            `\n💡 *Puedes reservar estas opciones al instante desde la pestaña Booking de la app.*`;
        }
      }
    }
    
    // 5. Build body
    let body = "";
    if (bestDoc && maxScore > 2) {
      body = `**${bestDoc.title}**\n\n${bestDoc.content}`;
      
      // Suggest related articles
      const actualRelated = relatedDocs.filter(d => d.id !== bestDoc.id).slice(0, 2);
      if (actualRelated.length > 0) {
        body += `\n\n🔍 **Temas relacionados sugeridos:**\n` +
          actualRelated.map(d => `• *${d.title}* (puedes preguntarme sobre esto)`).join('\n');
      }
    } else {
      // General fallbacks if RAG match score is too low
      if (q.includes('bdsm') || q.includes('sumis') || q.includes('dominan')) {
        body = "El **BDSM** abarca prácticas consensuadas de Bondage, Disciplina, Dominación, Sumisión, Sadismo y Masoquismo. Se rige por el principio **SSC** (Sano, Seguro y Consensuado) o **RACK** (Riesgo Aceptado y Consensuado). Los roles habituales son el Dominante (Dom) y el Sumiso (Sub), siendo obligatoria la fijación de una Safe Word (palabra de seguridad) antes de comenzar una escena.";
      } else if (q.includes('club') || q.includes('local') || q.includes('privee')) {
        body = "Los clubes swingers son locales seguros y discretos. Requieren cumplir el dress code del local, mantener discreción y seguir la regla de oro: 'El No es No'. Entre los más exclusivos en España se encuentran Privee Club Madrid y Oasis Barcelona. Puedes explorar sus fichas y reservar entradas desde el panel de Booking.";
      } else if (q.includes('pagar') || q.includes('precio') || q.includes('pro') || q.includes('membresia')) {
        body = "La membresía **SwingerSphere PRO** tiene un precio de 9,99 EUR/mes. Permite enviar mensajes privados sin límites, activar el modo invisible, subir fotos efímeras en RAM (ConsentVault) y acceder a la agenda completa de eventos verificados. Puedes pagarla con tarjeta via Stripe/Transak, Bizum, PayPal o Crypto.";
      } else {
        body = "Entiendo tu consulta sobre el lifestyle swinger y BDSM. En esta comunidad todo se rige por la comunicación honesta, el consentimiento y el respeto mutuo.\n\nPuedes preguntarme detalladamente sobre:\n• **Prácticas y Fetiches:** Shibari, safe words, dominación, roles.\n• **Relaciones:** Abiertas, poliamor, soft swap y full swap.\n• **Servicios de la App:** Cómo certificar tu club, gestionar reservas en el CRM, o buscar viajes en Booking.";
      }
    }
    
    return intro + "\n\n" + body + bookingRecs + "\n\n" +
      "--- \n" +
      "🤖 *Limoncito está operando en Modo Simulación Local. Para activar las respuestas hiper-inteligentes de la IA real de Google Gemini (100% GRATIS), haz clic en el engranaje ⚙️ de la cabecera y configura tu API Key en 10 segundos.*";
  }

  async function generate(userMsg, context) {
    const cfg = getConfig();
    
    // If local API key is present (dev override), use it directly
    if (cfg.apiKey) {
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
      if (cfg.provider === 'gemini') return await callGemini(cfg.apiKey, fullPrompt);
      if (cfg.provider === 'openai') return await callOpenAI(cfg.apiKey, fullPrompt);
      return null;
    }

    // Default Production behavior: Call secure Vercel Serverless Function (0 cost)
    try {
      const response = await fetch('/api/limoncito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMsg, context }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.text;
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server HTTP ${response.status}`);
      }
    } catch (e) {
      console.warn('[LimocitoCore] Serverless API call failed, falling back to local simulation:', e.message);
      // Fallback to local KB simulation if server key is not configured yet
      return generateSimulatedResponse(userMsg, context);
    }
  }

  return { getConfig, setConfig, generate };
})();

window.LimocitoLLM = LimocitoLLM;

// ═══════════════════════════════════════════════════
// LAYER 2: KNOWLEDGE BASE
// ═══════════════════════════════════════════════════
const LIMONCITO_KB = {

  pagos: [
    {
      id: 'pg1',
      title: 'Como pagar la membresia PRO',
      tags: ['pago','tarjeta','precio','membresia','activar','stripe','bizum','paypal','10','9.99'],
      content: 'Activar SwingerSphere PRO cuesta 9,99 EUR/mes y tienes 3 formas de pago:\n\n💳 TARJETA (mas facil): Toca "Pagar con tarjeta". Se abre Stripe (igual que comprar en Amazon). 30 segundos y acceso inmediato.\n\n📱 BIZUM (solo España): Envia 9,99 EUR al numero de Bizum. Pon tu referencia en el concepto. Activacion en ~10 minutos.\n\n🔵 PAYPAL: Paga con tu cuenta PayPal o como invitado con tarjeta. Introduce el ID de transaccion y se activa al instante.\n\n🔐 CRYPTO (avanzado): USDC en Polygon, Arbitrum o Ethereum. Verificacion automatica por blockchain.'
    },
    {
      id: 'pg2',
      title: 'Pago con tarjeta Stripe',
      tags: ['stripe','tarjeta','visa','mastercard','amex','seguro','pago','rapido'],
      content: 'Stripe es el procesador de pagos que usan Spotify, Amazon, Airbnb y Apple. Es 100% seguro. Tu tarjeta nunca llega a los servidores de SwingerSphere — va directamente a Stripe con encriptacion SSL. Proceso: click en "Pagar con tarjeta" → se abre la pagina de Stripe → introduces datos de tarjeta → confirmas el pago → vuelves automaticamente con tu PRO activado. Importe: 9,99 EUR/mes.'
    },
    {
      id: 'pg3',
      title: 'Pago con Bizum',
      tags: ['bizum','banco','transferencia','espana','rapido','movil','bbva','santander','caixa'],
      content: 'Bizum es la forma mas rapida de pagar en España. Disponible en mas de 25 bancos: BBVA, Santander, CaixaBank, ING, Sabadell, Bankinter... Pasos: 1) Abre tu app bancaria. 2) Busca Bizum o Enviar dinero. 3) Introduce el numero de SwingerSphere y 9,99 EUR. 4) En el concepto pon tu codigo de referencia (lo ves en la pantalla de pago). 5) En unos minutos el equipo activa tu cuenta.'
    },
    {
      id: 'pg4',
      title: 'Prueba gratuita 7 dias',
      tags: ['prueba','gratis','7 dias','trial','gratuito','free','periodo'],
      content: 'Los nuevos usuarios tienen 7 dias de acceso gratuito completo a SwingerSphere. Durante la prueba tienes acceso a todas las funciones PRO. Al finalizar, puedes continuar con tu membresia PRO por 9,99 EUR/mes. Si no la activas, la app muestra una pantalla de pago con los tres metodos disponibles. No hay renovacion automatica — tu decides cuando pagar.'
    },
    {
      id: 'pg5',
      title: 'Pago con PayPal',
      tags: ['paypal','pp','cuenta','pago','invitado'],
      content: 'Con PayPal puedes pagar con tu saldo PayPal, tarjeta vinculada o como invitado (sin necesidad de cuenta). Proceso: click en "Pagar con PayPal" → te abre la app o web de PayPal → confirmas 9,99 EUR → copias el ID de transaccion del email de confirmacion → lo pegas en SwingerSphere → PRO activado al instante. PayPal tiene proteccion al comprador.'
    },
  ],

  lifestyle: [
    {
      id: 'ls1',
      title: 'Que es el lifestyle swinger',
      tags: ['lifestyle','swinger','pareja','que es','definicion','swing'],
      content: 'El lifestyle swinger es una practica de adultos en pareja (o singles) que con pleno consentimiento mutuo disfrutan de encuentros sociales o intimos con otras personas. No es infidelidad — se basa en comunicacion, confianza y normas claras entre la pareja. Existen diferentes niveles de participacion: soft swap, full swap, voyeurismo, exhibicionismo... Cada pareja decide sus limites.'
    },
    {
      id: 'ls2',
      title: 'Pilares del lifestyle',
      tags: ['pilares','valores','confianza','respeto','comunicacion','consenso'],
      content: 'Los 4 pilares del lifestyle son: 1) COMUNICACION — hablar abiertamente con tu pareja sobre deseos y limites. 2) CONSENTIMIENTO — todo siempre con permiso explicito de todos los implicados. 3) DISCRECION — la privacidad de los demas es sagrada. 4) RESPETO — un "no" es un "no" sin presiones ni cuestionamientos. Estos pilares hacen que la comunidad sea segura y enriquecedora.'
    },
    {
      id: 'ls3',
      title: 'Vocabulario lifestyle glosario',
      tags: ['vocabulario','glosario','soft swap','full swap','unicornio','vainilla','sls','fetlife','ons'],
      content: 'Glosario esencial:\n• Soft swap: intercambio parcial (sin penetracion)\n• Full swap: intercambio completo\n• Unicornio: mujer bisexual que se une a una pareja\n• Vainilla: persona sin experiencia lifestyle\n• ONS: one night stand (encuentro de una noche)\n• SLS: SwingLifeStyle, portal de referencia\n• Voyeur/exhibicionista: observar/ser observado\n• NSA: no strings attached (sin compromiso)'
    },
  ],

  clubs: [
    {
      id: 'cl1',
      title: 'Los mejores clubs lifestyle del mundo',
      tags: ['clubs','mejores','mundo','resort','lifestyle','europa','usa'],
      content: 'Clubs de referencia mundial:\n\n🇺🇸 EEUU: Hedonism II (Jamaica, todo incluido), The Green Door (Las Vegas), Bliss (NYC)\n🇫🇷 Francia: Les Chandelles (Paris, el mas famoso de Europa)\n🇩🇪 Alemania: Kit Kat Club (Berlin, referencia fetish-lifestyle)\n🇪🇸 España: Privee Club (Madrid), Koi (Barcelona), Le Boudoir (Barcelona)\n🇲🇽 Mexico: Desire Pearl Resort (Cancun, todo incluido)\n\nEn SwingerSphere tenemos convenios con mas de 200 clubs. Los miembros PRO tienen descuentos del 20-50%.'
    },
    {
      id: 'cl2',
      title: 'Primera vez en un club consejos',
      tags: ['primera vez','novato','consejos','entrada','protocolo','primer'],
      content: 'Consejos para tu primera visita a un club:\n\n1) Llegad pronto (antes de las 23h) para conocer el ambiente relajado\n2) Vestid elegantes pero comodos — hay dress code generalmente\n3) Nunca toques a nadie sin preguntar primero\n4) El "no" se respeta siempre, sin insistir\n5) El movil va guardado — la privacidad es sagrada\n6) Tomad solo lo que necesiteis — la sobriedad mejora la experiencia\n7) No os separes mucho al principio si vais en pareja\n8) Observar antes de participar es totalmente normal'
    },
  ],

  privacidad: [
    {
      id: 'pr1',
      title: 'Privacidad y seguridad en SwingerSphere',
      tags: ['privacidad','seguridad','fotos','datos','anonimo','efimeras','ram'],
      content: 'SwingerSphere usa tecnologia ConsentVault™: las fotos intimas se almacenan solo en RAM, no en disco. Se destruyen automaticamente en 30 minutos. Los metadatos EXIF se eliminan antes de mostrar cualquier imagen. El chat usa encriptacion E2E. Tu perfil puede estar en modo "Fantasma" — invisible para busquedas. Tienes 6 niveles de privacidad por contenido: publico, amigos, contactos aprobados, temporal, una vez, autodestruccion.'
    },
    {
      id: 'pr2',
      title: 'ConsentVault sistema de consentimiento',
      tags: ['consentvault','consentimiento','sistema','privacidad','proteccion'],
      content: 'ConsentVault™ es el sistema de gestion de consentimiento de SwingerSphere. Permite: 1) Aprobar manualmente quien puede ver tu contenido intimo. 2) Revocar acceso en cualquier momento. 3) Establecer caducidad automatica del contenido. 4) Historial de accesos anonimizado. Cumple con GDPR, LOPD y la normativa europea de proteccion de datos. Tu eres siempre el dueno de tu contenido.'
    },
  ],

  eventos: [
    {
      id: 'ev1',
      title: 'Eventos y fiestas lifestyle',
      tags: ['eventos','fiestas','agenda','donde','cuando','citas'],
      content: 'SwingerSphere tiene una agenda de eventos verificados en mas de 40 paises. Los eventos incluyen: fiestas privadas en villas, encuentros en clubs colaboradores, cenas de presentacion (vanilla-friendly), viajes grupales, retiros de fin de semana. Los miembros PRO ven los eventos con 48h de antelacion y tienen acceso a listas de invitados exclusivas. Los organizadores verificados tienen badge de confianza.'
    },
  ],

  viajes: [
    {
      id: 'vi1',
      title: 'Viajes lifestyle Passport SwingerSphere',
      tags: ['viajes','passport','lifestyle','destinos','viajar','vacaciones'],
      content: 'El Passport Lifestyle™ de SwingerSphere activa cuando registras un viaje:\n\n✈️ Introduccion de fechas y destino\n🏛️ Lista de clubs verificados en esa ciudad\n📅 Eventos durante tus fechas\n👥 Usuarios compatibles (siempre respetando la privacidad)\n🏨 Hoteles lifestyle-friendly asociados\n🍽️ Restaurantes recomendados por la comunidad\n🚇 Consejos de transporte y seguridad local\n\nEscribeme "Voy a [ciudad] del [fecha] al [fecha]" y te preparo todo.'
    },
  ],

  normas: [
    {
      id: 'nr1',
      title: 'Normas de la comunidad SwingerSphere',
      tags: ['normas','reglas','comunidad','conducta','comportamiento'],
      content: 'Normas fundamentales de la comunidad:\n\n1) CONSENTIMIENTO: Todo requiere acuerdo explicito previo. No se puede presumir el consentimiento.\n2) PRIVACIDAD: Prohibido compartir informacion o fotos de otros sin su permiso expreso.\n3) RESPETO: Cualquier forma de presion, acoso o discriminacion es motivo de expulsion inmediata.\n4) AUTENTICIDAD: Perfiles falsos o fotos de otras personas = ban permanente.\n5) DISCRECION: Lo que ocurre en la comunidad, se queda en la comunidad.\n6) EDAD: Solo mayores de 18 anos verificados.\n7) LEGALIDAD: La plataforma opera bajo legislacion española y GDPR europeo.'
    },
  ],

  salud: [
    {
      id: 'sa1',
      title: 'Salud e ITS en el lifestyle',
      tags: ['salud','its','preservativo','prevencion','ets','sanitario','proteccion'],
      content: 'La salud sexual responsable es fundamental en el lifestyle:\n\n🔬 Revisiones periodicas: se recomienda hacerse pruebas de ITS cada 3-6 meses si tienes vida sexual activa.\n🛡️ Preservativo: el uso es la norma en la mayoria de clubs y encuentros.\n💊 PrEP: consulta con tu medico si eres candidato/a.\n🍷 Alcohol: con moderacion — la sobriedad mejora la experiencia y el juicio.\n📋 Comunicacion: comenta abiertamente tu estatus de salud con las personas con las que te relacionas. La honestidad protege a todos.'
    },
  ],

  etiqueta: [
    {
      id: 'et1',
      title: 'Etiqueta y protocolo en clubs y eventos',
      tags: ['etiqueta','protocolo','conducta','dress code','ropa','movil','manos'],
      content: 'Protocolo esencial para clubs y eventos lifestyle:\n\n📱 MOVIL: Guardado y en silencio. Fotografia/video sin permiso = expulsion.\n👔 DRESS CODE: Elegante o tematico segun el evento. Consulta siempre antes.\n👐 CONTACTO: Nunca toques a nadie sin preguntar. "Puedo?" es lo correcto.\n🙅 RECHAZO: Se acepta sin cuestionamientos. "No" es "no", nunca negociable.\n🍸 BEBIDAS: No aceptes bebidas de desconocidos sin verlas servir.\n🚿 HIGIENE: Fundamental. La mayoria de clubs tienen duchas disponibles.\n💬 CONVERSACION: Presentate, charla, conecta. Es un ambiente social antes que sexual.'
    },
  ],

  fondos: [
    {
      id: 'fo1',
      title: 'Fondos comunitarios y distribucion',
      tags: ['fondos','dinero','distribucion','comunidad','ingresos','organizador'],
      content: 'El sistema de fondos de SwingerSphere distribuye los ingresos de membresias de forma transparente:\n\n💰 40% — Operaciones y tecnologia (servidores, seguridad, desarrollo)\n🎉 30% — Fondo de eventos comunitarios (subsidios para eventos verificados)\n🏛️ 20% — Comisiones a organizadores y clubs verificados\n🌱 10% — Fondo de reserva y expansion\n\nLos organizadores verificados pueden proponer eventos y recibir apoyo del fondo comunitario. La contabilidad es auditada anualmente.'
    },
  ],

  FAQ: [
    {
      id: 'fq1',
      title: 'Preguntas frecuentes de SwingerSphere',
      tags: ['faq','preguntas','frecuentes','dudas','como','para que','ayuda','expulsion','expulcion','normas','violacion','sanciones','expulsar','bloquear'],
      content: 'Aquí tienes las respuestas a las preguntas más frecuentes sobre SwingerSphere explicadas de forma cercana:\n\n👥 ¿LA APLICACIÓN ES SOLO PARA PAREJAS?\n¡Para nada! SwingerSphere acoge a todo tipo de personas: parejas (heterosexuales, LGTBI+, swingers), personas solteras (singles) y usuarios de todas las identidades y géneros que tengan la mente abierta y busquen conectar con honestidad.\n\n🛡️ ¿PUEDO USAR LA APP DE FORMA ANÓNIMA?\nTotalmente. Tu privacidad es sagrada para nosotros. Puedes elegir un alias (nombre de usuario) que no revele tu identidad real y activar el "Modo Fantasma" en los ajustes de privacidad para ocultar tu ubicación exacta o decidir quién puede ver tu perfil.\n\n🔞 ¿HAY VERIFICACIÓN DE EDAD?\nSí, de forma obligatoria. Para garantizar que SwingerSphere sea un espacio seguro y maduro, verificamos la mayoría de edad de todos los usuarios durante el registro mediante un proceso rápido y 100% privado.\n\n🇪🇸 ¿ES TOTALMENTE LEGAL Y SEGURO?\nPor supuesto. Operamos de manera transparente bajo la legislación española y cumplimos estrictamente con la normativa europea de protección de datos (GDPR) y la nueva directiva MiCA para la gestión de USDC.\n\n⚖️ ¿CÓMO SE SANCIONAN LOS COMPORTAMIENTOS INADECUADOS?\nTenemos tolerancia cero con el acoso o cualquier infracción de las normas. Cualquier reporte de mal comportamiento es analizado por nuestro equipo de soporte humano, con expulsión inmediata en caso de violar las reglas de consentimiento.'
    },
  ],

  booking: [
    {
      id: 'bk1',
      title: 'Booking Lifestyle reservas',
      tags: ['booking','reserva','hotel','resort','entrada','viaje','reservar','alojamiento','desire','hedonism'],
      content: 'SwingerSphere Booking Lifestyle te permite reservar directamente:\n\n🏨 Hoteles y resorts: Desire Pearl Cancun (350 EUR/noche), Hedonism II Jamaica (280 EUR/noche), Cap dAgde Resort (180 EUR/noche), Temptation Cancun (220 EUR/noche)\n🎉 Eventos y fiestas: desde 25 EUR/pareja\n🎟️ Entradas a clubs: desde 20 EUR/persona\n✈️ Viajes y paquetes: Cap dAgde 5 dias (890 EUR/pp), Crucero (1200 EUR/pp)\n\nPrecio final sin comisiones para ti. Paga con tarjeta o crypto. Reserva en 2 minutos.'
    },
    {
      id: 'bk2',
      title: 'Entradas a clubs',
      tags: ['entrada','club','privee','kit kat','chandelles','oasis','ticket','aforo'],
      content: 'Compra entradas a los mejores clubs directamente desde SwingerSphere:\n\n🏛️ Privee Madrid: 25 EUR/pareja\n🏛️ Kit Kat Berlin: 20 EUR/persona\n🏛️ Les Chandelles Paris: 80 EUR/pareja\n🏛️ Oasis Barcelona: 35 EUR/pareja\n\nEntrada garantizada, sin colas. Recibes un QR de confirmacion. Comision 0% para ti — el club paga la comision.'
    },
  ],

  certificacion: [
    {
      id: 'ce1',
      title: 'Certificacion Oficial SwingerSphere',
      tags: ['certificacion','verificado','badge','sello','check','oficial','certificar'],
      content: 'La Certificacion Oficial SwingerSphere es el sello de confianza del lifestyle. Tipos:\n\n🏛️ Club Verificado: 149 EUR/ano — badge dorado, prioridad en busquedas, Limoncito te recomienda\n🎉 Evento Verificado: 99 EUR/ano — sello en agenda, push a usuarios, analytics\n👤 Organizador Verificado: 99 EUR/ano — perfil destacado, TrustScore +15\n🏢 Negocio Verificado: 199 EUR/ano — marketplace prioritario, landing en la app\n\nSolicita tu certificacion desde Configuracion > Certificacion Oficial.'
    },
  ],

  business: [
    {
      id: 'bz1',
      title: 'SwingerSphere Business CRM para clubs',
      tags: ['business','crm','club','gestion','socios','reservas','ticketing','estadisticas','software','programa'],
      content: 'SwingerSphere Business es el CRM todo-en-uno para clubs y locales lifestyle:\n\n📊 Dashboard con metricas en tiempo real\n👥 Gestion de socios (VIP, regular, nuevo)\n📅 Sistema de reservas con calendario\n🎟️ Ticketing digital con QR\n📈 Estadisticas de ocupacion e ingresos\n🍋 IA Comercial (Limoncito te asesora)\n\nPlanes: Basico 40 EUR/45 dias · Premium 100 EUR/45 dias · Elite 200 EUR/45 dias\n\nSustituye 4-5 programas distintos. Todo centralizado en una sola plataforma.'
    },
  ],
};

// ═══════════════════════════════════════════════════
// LAYER 3: RAG ENGINE (lightweight TF-IDF)
// ═══════════════════════════════════════════════════
const RAGEngine = (() => {
  let _allDocs = null;
  const STOPWORDS = new Set(['de', 'la', 'el', 'un', 'una', 'y', 'o', 'a', 'en', 'con', 'para', 'que', 'si', 'no', 'del', 'los', 'las', 'por', 'su', 'sus', 'es', 'como', 'esta', 'este']);

  function _getAllDocs() {
    if (_allDocs) return _allDocs;
    _allDocs = [];
    for (const [collection, docs] of Object.entries(LIMONCITO_KB)) {
      for (const doc of docs) {
        _allDocs.push({ ...doc, collection });
      }
    }
    return _allDocs;
  }

  function _tokenize(text) {
    var raw = (text || '').toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
      .split(/\W+/);
    return raw.filter(function(t) {
      return t.length > 2 && !STOPWORDS.has(t);
    });
  }

  function _score(query, doc) {
    var qTokens = _tokenize(query);
    if (qTokens.length === 0) return 0;
    var docText = (doc.title + ' ' + doc.tags.join(' ') + ' ' + doc.content).toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u');
    
    var docTokens = docText.split(/\W+/);
    var score = 0;
    for (var i = 0; i < qTokens.length; i++) {
      var t = qTokens[i];
      // Match exact words, or words containing the token, or token containing the word (min length 3)
      var count = docTokens.filter(function(w) { 
        return w === t || (w.length >= 3 && t.length >= 3 && (w.indexOf(t) !== -1 || t.indexOf(w) !== -1)); 
      }).length;
      
      if (count > 0) {
        score += 1 + Math.log(count);
      }
      if (doc.tags.some(function(tag) { 
        var cleanTag = tag.toLowerCase();
        return cleanTag === t || (cleanTag.length >= 3 && t.length >= 3 && (cleanTag.indexOf(t) !== -1 || t.indexOf(cleanTag) !== -1));
      })) {
        score += 5;
      }
      var titleTokens = doc.title.toLowerCase()
        .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
        .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u')
        .split(/\W+/);
      if (titleTokens.some(function(w) {
        return w === t || (w.length >= 3 && t.length >= 3 && (w.indexOf(t) !== -1 || t.indexOf(w) !== -1));
      })) {
        score += 3;
      }
    }
    return score;
  }

  function retrieve(query, topK, minScore) {
    topK = topK || 3;
    minScore = minScore || 0;
    const docs = _getAllDocs();
    const scored = docs
      .map(d => ({ doc: d, score: _score(query, d) }))
      .filter(x => x.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return scored.map(x => x.doc);
  }

  function buildContext(docs) {
    return docs.map(d => `[${d.collection.toUpperCase()}] ${d.title}:\n${d.content}`).join('\n\n---\n\n');
  }

  return { retrieve, buildContext };
})();

// ═══════════════════════════════════════════════════
// LAYER 4: COMMUNITY MEMORY (anon localStorage)
// ═══════════════════════════════════════════════════
const CommunityMemory = (() => {
  const KEY = 'lmcito_memory';

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }

  function _save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
  }

  function recordQuery(query) {
    const data = _load();
    if (!data.queries) data.queries = [];
    data.queries.unshift({ q: query.slice(0, 80), ts: Date.now() });
    data.queries = data.queries.slice(0, 20); // Keep last 20
    _save(data);
  }

  function getRecentTopics() {
    const data = _load();
    return (data.queries || []).slice(0, 5).map(q => q.q);
  }

  return { recordQuery, getRecentTopics };
})();

// ═══════════════════════════════════════════════════
// LAYER 5: CONCIERGE DETECTOR
// ═══════════════════════════════════════════════════
const ConciergeDetector = (() => {
  const TRAVEL_PATTERNS = [
    /(?:voy|viajo|viaje|visito|viajar)\s+a\s+([a-zA-ZÁ-Úá-ú\s]+?)(?:\s+del?\s+|,|$)/i,
    /(?:estar[eé]|estar[eé]mos|ir)\s+en\s+([a-zA-ZÁ-Úá-ú\s]+?)(?:\s+del?\s+|,|$)/i,
    /trip\s+to\s+([a-zA-Z\s]+?)(?:\s+from|\s+between|,|$)/i,
  ];

  const DATE_PATTERNS = [
    /del?\s+(\d{1,2})\s+al?\s+(\d{1,2})\s+(?:de\s+)?(\w+)/i,
    /from\s+(\w+)\s+(\d{1,2})\s+to\s+(\w+)\s+(\d{1,2})/i,
  ];

  const CITY_DATA = {
    'barcelona': { flag: '🇪🇸', clubs: ['Oasis Barcelona', 'Boudoir Club', 'Le Club', 'Koi Barcelona'], events: ['Fiesta Privee Sabado', 'Lifestyle Pool Party Sunday'], tips: ['Barrio Gothic para cenar', 'La Barceloneta para pasear', 'No toques sin pedir — muy importante'], hotels: ['Hotel Arts', 'W Barcelona (lifestyle-friendly)'], restaurants: ['La Pepita', 'Cerveceria Catalana'], transport: 'Metro L1/L5 muy eficiente · Taxi disponible 24h' },
    'madrid': { flag: '🇪🇸', clubs: ['Privee Club Madrid', 'Sublime Madrid', 'Paradise Club', 'Tiffany Swing'], events: ['Jueves Singles Night', 'Viernes Parejas VIP', 'Fiesta Mascaras Sabado'], tips: ['Ambiente a partir de medianoche', 'Dress code elegante-sensual', 'Zona Chueca y Salamanca son lifestyle-friendly'], hotels: ['Hotel Riu Plaza', 'Vincci Centro'], restaurants: ['DiverXO', 'StreetXO'], transport: 'Metro hasta las 1:30 · Uber/Cabify disponibles' },
    'paris': { flag: '🇫🇷', clubs: ['Les Chandelles (el mas famoso del mundo)', 'Le Melrose', 'Chris et Manu', '2+2'], events: ['Les Chandelles Vendredi Soir', 'Soiree Fetish Samedi'], tips: ['Reserva con antelacion — se llena', 'Frances basico recomendado', 'Llevar efectivo y tarjeta'], hotels: ['Hotel Riviera', 'Le Marais boutique hotels'], restaurants: ['Le Jules Verne', 'Chez L\'Ami Jean'], transport: 'Metro hasta las 1h (fines de semana 24h) · Taxi facil' },
    'berlin': { flag: '🇩🇪', clubs: ['Kit Kat Club (referencia mundial)', 'Insomnia', 'Ficken 3000', 'SodaClub'], events: ['Kit Kat CarneBall Bizarre', 'Berghain Weekends'], tips: ['Dress code muy importante en KitKat', 'Cultura de respeto absoluto', 'No saques el movil'], hotels: ['25hours Hotel Bikini', 'Michelberger Hotel'], restaurants: ['Nobelhart & Schmutzig', 'Nobelhart'], transport: 'U-Bahn 24h fines de semana · Bici muy recomendada' },
    'ibiza': { flag: '🇪🇸', clubs: ['Lips Ibiza', 'Eden Ibiza (eventos privados)', 'Villa privada lifestyle'], events: ['Secret Garden Party', 'Lifestyle Pool Weekend'], tips: ['Temporada: junio-septiembre', 'Alquila villa para mayor privacidad', 'Ambiente mas liberal que peninsula'], hotels: ['Aguas de Ibiza', 'Hacienda Na Xamena'], restaurants: ['El Chiringuito', 'Sa Capella'], transport: 'Taxi o alquiler de coche recomendado' },
    'amsterdam': { flag: '🇳🇱', clubs: ['Getto Amsterdam', 'Club Exit', 'Sinners in Heaven'], events: ['ADE After Parties (octubre)', 'Lifestyle Monday Club'], tips: ['Ambiente muy abierto y sin juicios', 'Ingles funciona perfectamente', 'Respeto a la discrecion'], hotels: ['The Dylan Amsterdam', 'Pulitzer Amsterdam'], restaurants: ['Bord\'Eau', 'Rijsel'], transport: 'Bici o tranvia — muy facil · Tren central desde aeropuerto' },
    'cancun': { flag: '🇲🇽', clubs: ['Desire Pearl Resort (todo incluido)', 'Desire Riviera Maya', 'Eden Lifestyle Resort'], events: ['Temptation Resort Takeovers', 'Hedonism Mexico events'], tips: ['Reserva el resort con 3+ meses de antelacion', 'Todo incluido = mas relajado', 'Zona hotelera vs Cancun centro'], hotels: ['Desire Pearl Resort', 'Desire Riviera Maya', 'Temptation Resort'], restaurants: ['Incluidos en el resort'], transport: 'Transfer privado desde aeropuerto recomendado' },
  };

  function detect(msg) {
    const lw = msg.toLowerCase();
    let city = null;

    for (const [key, data] of Object.entries(CITY_DATA)) {
      if (lw.includes(key)) { city = { key, ...data }; break; }
    }
    if (!city) return null;

    // Extract date
    let dateStr = null;
    for (const pat of DATE_PATTERNS) {
      const m = msg.match(pat);
      if (m) { dateStr = m[0]; break; }
    }

    return { city: city.key, cityName: city.key.charAt(0).toUpperCase() + city.key.slice(1), ...city, dateStr };
  }

  return { detect };
})();

// ═══════════════════════════════════════════════════
// KB FALLBACK RESPONSES
// ═══════════════════════════════════════════════════
const KB_FALLBACK = {
  greeting: ['Hola! Soy Limoncito, tu guia del lifestyle. Tengo una prueba de 7 dias gratis para ti. Puedo ayudarte con clubs, eventos, privacidad, pagos y mucho mas. Preguntame lo que necesites!'],
  empty: ['Hmm, no encuentro informacion especifica sobre eso. Intenta preguntarme sobre: clubs, eventos, privacidad, pagos o el lifestyle en general.'],
};

// ═══════════════════════════════════════════════════
// MAIN CORE: LimocitoCore
// ═══════════════════════════════════════════════════
const LimocitoCore = {
  async process(userMsg, onPhase) {
    if (!userMsg || !userMsg.trim()) {
      return { text: KB_FALLBACK.greeting[0], type: 'kb', suggestions: [] };
    }

    CommunityMemory.recordQuery(userMsg);
    const cleanMsg = userMsg.toLowerCase().trim();

    // ── 1. GREETINGS & INTRO CONVERSATION ──
    const greetings = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'ey', 'hello', 'hi', 'hola!', 'quien eres', 'que eres', 'que haces', 'como estas', 'como te va'];
    if (greetings.some(g => cleanMsg === g || cleanMsg.startsWith(g + ' ') || g.startsWith(cleanMsg))) {
      return {
        type: 'kb',
        text: "¡Hola! 🍋 Soy **Limoncito**, tu agente de IA oficial y oráculo en SwingerSphere.\n\nPuedo guiarte por toda la plataforma de forma interactiva. Intenta pedirme cosas como:\n\n• 💳 **Membresía PRO:** Escribe *'pagar pro'* para activar tu suscripción.\n• 💰 **Billetera USDC:** Escribe *'ver saldo'*, *'depositar'* o *'retirar a banco'*.\n• 🏨 **Viajes y Reservas:** Escribe *'buscar hoteles'* o *'mis reservas'*.\n• 🏛️ **Clubes y CRM:** Escribe *'abrir dashboard'* o *'certificar club'*.\n• 🏳️‍🌈 **Banderas LGTBI+:** Escribe *'significado de la bandera bisexual'* o *'bandera progreso'*.\n• 🔗 **Lifestyle & BDSM:** Pregúntame sobre safe words, shibari o relaciones abiertas.\n\n¿En qué te puedo ayudar hoy?",
        suggestions: [
          { label: '💰 Ver Saldo', q: 'ver saldo' },
          { label: '🏨 Buscar Hoteles', q: 'buscar hoteles' },
          { label: '🏳️‍🌈 Banderas LGTBI', q: 'ver significado banderas' }
        ]
      };
    }

    // ── 2. INTENTS & ACTIONS DETECTION ──
    let detectedAction = null;
    let actionResponse = "";
    
    if (/(?:saldo|balance|mi dinero|billetera|wallet|usdc|cargar saldo|recargar|depositar|meter|retirar|sacar|banco|iban|transferencia)/.test(cleanMsg)) {
      if (/(?:depositar|recargar|meter|tarjeta|comprar usdc|comprar)/.test(cleanMsg)) {
        detectedAction = "deposit";
        actionResponse = "¡Perfecto! He abierto la pasarela de **Depósito On-Ramp**. Aquí puedes recargar USDC al instante con tu tarjeta de crédito o Apple Pay para pagar tus reservas.";
      } else if (/(?:retirar|sacar|banco|iban|transferencia|sepa)/.test(cleanMsg)) {
        detectedAction = "withdraw";
        actionResponse = "¡Entendido! He abierto la pantalla de **Retiro Off-Ramp**. Introduce la cantidad y tu IBAN para transferir tus USDC directamente a tu cuenta de banco en euros vía SEPA.";
      } else {
        detectedAction = "wallet";
        actionResponse = "¡Por supuesto! He abierto tu **Billetera SwingerSphere**. Aquí puedes ver tu saldo de USDC, revisar el historial de transacciones, realizar depósitos en euros o retirar fondos a tu banco.";
      }
    } else if (/(?:pagar pro|activar pro|membresia pro|suscripcion pro|premium|hacerme pro|suscribirme|pro)/.test(cleanMsg) && !cleanMsg.includes('mejor') && !cleanMsg.includes('como')) {
      detectedAction = "payment";
      actionResponse = "¡Excelente! Te he abierto la pantalla de **Suscripción SwingerSphere PRO**. Por solo 9,99 EUR/mes obtendrás chat ilimitado, ConsentVault™ ilimitado, modo fantasma y hasta 50% de descuento en clubs asociados.";
    } else if (/(?:mis reservas|mis viajes|ver reservas|mis hoteles|mis entradas|ver mis reservas)/.test(cleanMsg)) {
      detectedAction = "my_bookings";
      actionResponse = "¡Aquí tienes! He abierto tu listado de **Reservas Personales**. Puedes consultar los detalles de tus viajes, hoteles reservados o ver los códigos QR para hacer check-in en los eventos.";
    } else if (/(?:buscar hoteles|viaje|resort|escapada|booking|reservar hotel|vacaciones)/.test(cleanMsg)) {
      detectedAction = "booking";
      actionResponse = "¡Excelente! Te he llevado a la sección de **Booking & Viajes**. Aquí puedes reservar resorts lifestyle-friendly como Desire Pearl en Cancún, hoteles boutique en Europa, o entradas a fiestas privadas.";
    } else if (/(?:certificar|certificacion|verificar club|verificar local|sello verificado|badge verificado)/.test(cleanMsg)) {
      detectedAction = "certify";
      actionResponse = "¡Perfecto! He abierto el panel de **Certificación Oficial SwingerSphere**. Es el sello de confianza para locales y organizadores, otorgándote prioridad en búsquedas e insignia de verificado.";
    } else if (/(?:crm|dashboard|administrar club|gestion de socios|dashboard club|panel club|abrir dashboard)/.test(cleanMsg)) {
      detectedAction = "clubs";
      actionResponse = "¡Entendido! He abierto el **Panel CRM de SwingerSphere Business** para gestores de locales. Aquí puedes administrar tus socios VIP, confirmar reservas del día y analizar estadísticas de ingresos.";
    } else if (/(?:conocer personas|conocer gente|conocer parejas|conocer solteros|hablar con alguien|hablar con personas|como ligar|como conectar|conectar con gente)/.test(cleanMsg)) {
      detectedAction = "discover";
      actionResponse = "¡Hola! Entiendo perfectamente tu pregunta. El lifestyle se basa en conectar de forma honesta, respetuosa y consentida. En SwingerSphere tienes varias maneras muy humanas y fluidas de conocer personas afines:\n\n1. 🔍 **Descubrir (Swipe):** Te he llevado a la sección de **Descubrir**. Aquí puedes ver perfiles cercanos, leer sus biografías, sus intereses y su TrustScore™. Si hay interés mutuo, podréis hablar al instante.\n2. 💬 **Comunidad y Mensajería E2E:** En la sección de **Comunidad** puedes participar en chats grupales o abrir conversaciones privadas cifradas de forma segura.\n3. 📅 **Eventos y Fiestas:** La forma más natural de conocer gente es en persona. Te sugiero acudir a un **Munch** (un encuentro social informal en un bar/restaurante sin presiones) o a una **Pool Party** verificada en tu zona.\n\n¡He abierto la pestaña de **Descubrir** para que empieces a explorar! ¿Qué tipo de ambiente te despierta más curiosidad?";
    } else if (/(?:faq|preguntas frecuentes|tengo dudas|dudas|como funciona|ayuda)/.test(cleanMsg)) {
      return {
        type: 'kb',
        text: "¡Hola! 🍋 Estoy aquí para ayudarte a resolver cualquier duda sobre SwingerSphere de forma cercana y clara. Aquí tienes las respuestas a las preguntas más comunes:\n\n👥 **¿Es solo para parejas?**\nPara nada. SwingerSphere acoge a parejas, personas solteras (singles) y usuarios de todas las identidades y géneros que busquen conectar de forma honesta y con mentalidad abierta.\n\n🛡️ **¿Es anónimo y seguro?**\nTotalmente. Tu privacidad es sagrada. Puedes usar un alias (nombre de usuario) y activar el *Modo Fantasma* en los ajustes de privacidad para decidir quién puede ver tu perfil o tu ubicación exacta.\n\n🔞 **¿Cómo funciona la verificación?**\nLa verificación de edad es obligatoria para garantizar un entorno 100% seguro y exclusivo para adultos. El proceso es rápido, privado y automatizado.\n\n⚖️ **¿Cómo protegéis la seguridad?**\nTenemos tolerancia cero frente a comportamientos inadecuados. El consentimiento es obligatorio y cualquier reporte de infracción de las normas resulta en la expulsión inmediata de la plataforma.\n\n¿Hay algún tema en particular en el que quieras profundizar o alguna pantalla que te gustaría que te abra?",
        suggestions: [
          { label: '🛡️ Seguridad', q: 'ajustes de seguridad' },
          { label: '🏛️ Buscar Locales', q: 'que locales hay en españa' },
          { label: '🏳️‍🌈 Banderas LGTBI', q: 'bandera progreso' }
        ]
      };
    }

    if (detectedAction) {
      return {
        type: 'kb',
        text: actionResponse,
        action: detectedAction,
        suggestions: this._getSuggestions(userMsg)
      };
    }

    // Phase 1: Check for travel/concierge trigger
    if (onPhase) onPhase('rag');
    const conciergeData = ConciergeDetector.detect(userMsg);
    if (conciergeData) {
      // Enrich with booking recommendations if available
      if (window.getBookingRecommendations) {
        conciergeData.bookings = getBookingRecommendations(conciergeData.key);
      }
      return { type: 'concierge', data: conciergeData };
    }

    // Phase 2: RAG retrieval (Min Score of 1.0 to prevent weak matching of unrelated generic questions)
    const docs = RAGEngine.retrieve(userMsg, 3, 1.0);
    const context = RAGEngine.buildContext(docs);

    // Phase 3: Try LLM if API key configured
    const cfg = LimocitoLLM.getConfig();
    if (cfg.apiKey) {
      try {
        if (onPhase) onPhase('llm');
        const llmResponse = await LimocitoLLM.generate(userMsg, context);
        if (llmResponse) {
          return {
            type: 'llm',
            text: llmResponse,
            suggestions: this._getSuggestions(userMsg),
          };
        }
      } catch (e) {
        console.warn('[LimocitoCore] LLM error, fallback to KB:', e.message);
        return {
          type: 'llm_error',
          text: `⚠️ **Error de conexión con la IA (Gemini):** ${e.message}\n\n*Por favor, comprueba que la clave de API es correcta. Mientras tanto, operando en modo local:* \n\n${docs.length > 0 ? docs[0].content : 'Sin respuesta local disponible.'}`,
          suggestions: this._getSuggestions(userMsg),
        };
      }
    }

    // Phase 4: KB Fallback
    if (onPhase) onPhase('fallback');
    if (docs.length > 0) {
      const best = docs[0];
      return {
        type: 'kb',
        text: best.content,
        suggestions: this._getSuggestions(userMsg),
      };
    }

    return {
      type: 'kb',
      text: "Entiendo tu consulta sobre SwingerSphere. Como tu asistente de IA, puedo guiarte y realizar acciones directas en la app. Intenta pedirme:\n\n• 💳 *'Pagar membresía PRO'* o *'Activar PRO'*\n• 💰 *'Ver saldo'*, *'Depositar'* o *'Retirar dinero'*\n• 🏨 *'Buscar hoteles'*, *'Mis reservas'* o *'Voy a Madrid'*\n• 🏛️ *'Abrir CRM'* o *'Certificar local'*\n• 🏳️‍🌈 *'Significado bandera bisexual'* o cualquier otra bandera del orgullo.",
      suggestions: this._getSuggestions(userMsg),
    };
  },

  _getSuggestions(query) {
    const lw = (query || '').toLowerCase();
    if (lw.includes('hotel') || lw.includes('reserv') || lw.includes('viaj'))
      return [
        { label: '🏨 Hoteles', q: 'Que hoteles lifestyle puedo reservar?' },
        { label: '✈️ Viajes', q: 'Paquetes de viaje lifestyle' },
        { label: '🎟️ Entradas', q: 'Entradas a clubs' },
      ];
    if (lw.includes('club') || lw.includes('negocio') || lw.includes('crm') || lw.includes('gestion'))
      return [
        { label: '🏛️ CRM', q: 'Como funciona SwingerSphere Business?' },
        { label: '🛡️ Certificar', q: 'Como certifico mi club?' },
        { label: '📢 Publicidad', q: 'Planes de publicidad para locales' },
      ];
    if (lw.includes('certific') || lw.includes('badge') || lw.includes('verific'))
      return [
        { label: '🛡️ Tipos', q: 'Que tipos de certificacion hay?' },
        { label: '💰 Precios', q: 'Cuanto cuesta la certificacion?' },
        { label: '📋 Solicitar', q: 'Como solicito la certificacion?' },
      ];
    if (lw.includes('bdsm') || lw.includes('bondage') || lw.includes('dominan') || lw.includes('sumis'))
      return [
        { label: 'Roles BDSM', q: 'Cuales son los roles en BDSM?' },
        { label: 'Bondage', q: 'Tipos de bondage y shibari' },
        { label: 'Aftercare', q: 'Safe words y aftercare en BDSM' },
      ];
    if (lw.includes('relacion') || lw.includes('pareja') || lw.includes('novio') || lw.includes('esposo') || lw.includes('poliamor'))
      return [
        { label: 'Tipos relacion', q: 'Tipos de relaciones abiertas y poliamor' },
        { label: 'Swap', q: 'Diferencia entre soft swap y full swap' },
        { label: 'Celos', q: 'Como manejar los celos en el lifestyle' },
      ];
    if (lw.includes('empezar') || lw.includes('principiant') || lw.includes('novato') || lw.includes('miedo'))
      return [
        { label: 'Guia inicio', q: 'Guia completa para principiantes' },
        { label: 'Miedos', q: 'Miedos comunes y como superarlos' },
        { label: 'Primer club', q: 'Consejos para primera vez en un club' },
      ];
    if (lw.includes('fetich') || lw.includes('kink') || lw.includes('latex') || lw.includes('cuero'))
      return [
        { label: 'Fetiches', q: 'Tipos de fetichismos comunes' },
        { label: 'Voyeur', q: 'Voyeurismo y exhibicionismo' },
        { label: 'Role play', q: 'Juegos de roles eroticos' },
      ];
    if (lw.includes('cuckold') || lw.includes('hotwife') || lw.includes('stag') || lw.includes('bull'))
      return [
        { label: 'Hotwife', q: 'Que es hotwife y stag vixen' },
        { label: 'Cuckold', q: 'Diferencia entre hotwife y cuckold' },
        { label: 'Reglas', q: 'Reglas para relaciones con terceros' },
      ];
    if (lw.includes('segur') || lw.includes('its') || lw.includes('droga') || lw.includes('protec'))
      return [
        { label: 'Encuentros', q: 'Protocolo de seguridad para encuentros' },
        { label: 'Salud', q: 'Prevencion de ITS en el lifestyle' },
        { label: 'Sustancias', q: 'Drogas y chemsex precauciones' },
      ];
    const all = [
      { label: 'BDSM', q: 'Que es el BDSM y como funciona?' },
      { label: 'Relaciones', q: 'Tipos de relaciones en el lifestyle' },
      { label: 'Hoteles', q: 'Hoteles y resorts lifestyle' },
      { label: 'Principiantes', q: 'Guia para principiantes' },
      { label: 'Clubs', q: 'Mejores clubs del mundo' },
      { label: 'Entradas', q: 'Comprar entradas a clubs' },
      { label: 'Hotwife', q: 'Que es hotwife y cuckold' },
      { label: 'Fetiches', q: 'Tipos de fetichismos' },
      { label: 'PRO', q: 'Como activo la membresia PRO?' },
    ];
    var offset = Math.floor(Date.now() / 60000) % (all.length - 2);
    return all.slice(offset, offset + 3);
  },
};

window.LimocitoCore = LimocitoCore;
console.log('Limoncito AI Core v2.0 loaded — KB docs:', Object.values(LIMONCITO_KB).flat().length);
