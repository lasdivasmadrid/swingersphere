// www/api/db.js — Serverless Cloud Database Endpoint
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (req.method === 'POST') {
    const { table, record } = req.body || {};
    if (!table || !record) return res.status(400).json({ error: 'Faltan parámetros: table y record' });

    console.log(`[DB RECORD STORE] ${table}:`, JSON.stringify(record));

    if (supabaseUrl && supabaseKey) {
      try {
        const spRes = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(record)
        });
        const spData = await spRes.json().catch(() => ({}));
        return res.status(200).json({ status: 'saved_supabase', data: spData });
      } catch (e) {
        console.error('Supabase error:', e);
      }
    }

    return res.status(200).json({ 
      status: 'saved_local', 
      message: 'Registro guardado en los logs del servidor. Configura SUPABASE_URL y SUPABASE_KEY para almacenamiento persistente en la nube.',
      record 
    });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'ok', 
      db: supabaseUrl ? 'Supabase Connected' : 'Vercel Cloud Logs Active'
    });
  }
}
