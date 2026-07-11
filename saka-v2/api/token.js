// Il widget vive sulla stessa origin di questa API: niente CORS aperto,
// così altri siti non possono mintare token Retell (che costano minuti) da fuori.
const AGENT_ID = process.env.RETELL_AGENT_ID || 'agent_2916d0fc0959c02c84c4eee4b2';

const ipHits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;
const MAP_MAX = 10000;

function checkRateLimit(ip) {
  const now = Date.now();
  if (ipHits.size >= MAP_MAX) {
    for (const [k, v] of ipHits) {
      if (now - v.start > WINDOW_MS) ipHits.delete(k);
    }
    if (ipHits.size >= MAP_MAX) return false;
  }
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    ipHits.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count++;
  ipHits.set(ip, entry);
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Troppe richieste. Riprova tra un minuto.' });
  }

  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: AGENT_ID,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[token] Retell error:', JSON.stringify(data));
      return res.status(502).json({ error: 'Servizio vocale non disponibile' });
    }
    return res.status(200).json({ access_token: data.access_token });
  } catch (err) {
    console.error('[token] error:', err.message);
    return res.status(500).json({ error: 'Servizio vocale non disponibile' });
  }
}
