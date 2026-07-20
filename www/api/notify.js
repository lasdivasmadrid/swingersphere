// www/api/notify.js — Serverless Telegram & Event Notification Engine
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { event, details } = req.body || {};
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Log event to Vercel console logs regardless
    console.log(`[EVENT LOG] ${event}:`, JSON.stringify(details));

    if (!botToken || !chatId) {
      return res.status(200).json({ 
        status: 'logged', 
        message: 'Evento registrado en Vercel Logs. Configura TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en Vercel para notificaciones instantáneas a Telegram.' 
      });
    }

    // Format rich Telegram HTML notification message based on event type
    let title = '🔔 *Nueva Interacción en SwingerSphere*';
    let bodyText = '';

    switch (event) {
      case 'age_verified':
        title = '🔞 *Nueva Verificación de Edad (+18)*';
        bodyText = `📅 *Fecha de Nacimiento:* \`${details?.dob || 'N/D'}\`\n🌐 *Idioma:* \`${details?.lang || 'es'}\``;
        break;
      case 'profile_created':
        title = '👤 *Nuevo Perfil Creado / Editado*';
        bodyText = `📛 *Alias:* \`${details?.name || 'Anónimo'}\`\n👫 *Tipo:* \`${details?.type || 'Pareja'}\`\n📍 *Ubicación:* \`${details?.city || 'España'}\`\n💬 *Bio:* _${details?.bio || 'Sin biografía'}_`;
        break;
      case 'venue_ad_requested':
        title = '🏛️ *Nueva Solicitud de Publicidad de Local*';
        bodyText = `🏢 *Negocio:* \`${details?.venueName || 'N/D'}\`\n⭐ *Plan:* \`${details?.plan || 'Premium'}\`\n📞 *Contacto:* \`${details?.contact || 'N/D'}\`\n💰 *Precio:* \`${details?.price || 'N/D'} EUR\``;
        break;
      case 'cert_requested':
        title = '🛡️ *Nueva Solicitud de Certificación*';
        bodyText = `🎖️ *Insignia:* \`${details?.badgeName || 'N/D'}\`\n🏢 *Negocio:* \`${details?.businessName || 'N/D'}\`\n📧 *Email:* \`${details?.email || 'N/D'}\``;
        break;
      case 'shadow_query':
        title = '💬 *Consulta Relevante a Shadow AI*';
        bodyText = `❓ *Pregunta:* _"${details?.query || ''}"_`;
        break;
      default:
        bodyText = `📄 *Detalles:* \`${JSON.stringify(details || {})}\``;
    }

    const message = `${title}\n\n${bodyText}\n\n🕒 _${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}_`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const tgRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const tgData = await tgRes.json().catch(() => ({}));
    return res.status(200).json({ status: 'ok', telegram: tgData });

  } catch (e) {
    console.error('Notification error:', e);
    return res.status(500).json({ error: e.message });
  }
}
