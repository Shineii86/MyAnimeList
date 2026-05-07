const { readData, writeData, getGhFromReq } = require('../../lib/data');
const { requireAuth } = require('../../lib/auth');

export default async function handler(req, res) {
  if (!requireAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  switch (req.method) {
    case 'GET': return handleGet(req, res);
    case 'POST': return handlePost(req, res);
    case 'DELETE': return handleDelete(req, res);
    default: return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  const gh = getGhFromReq(req);
  const data = await readData(gh);
  return res.status(200).json({ webhooks: data.webhooks || [] });
}

async function handlePost(req, res) {
  const { url, events, platform } = req.body;
  if (!url) return res.status(400).json({ error: 'Webhook URL is required' });

  const gh = getGhFromReq(req);
  const data = await readData(gh);
  if (!data.webhooks) data.webhooks = [];

  const webhook = {
    id: `wh_${Date.now()}`,
    url,
    platform: platform || 'generic', // 'discord', 'telegram', 'slack', 'generic'
    events: events || ['anime.added', 'anime.deleted', 'push'],
    enabled: true,
    createdAt: new Date().toISOString()
  };

  data.webhooks.push(webhook);
  await writeData(data, gh);

  return res.status(201).json({ success: true, webhook });
}

async function handleDelete(req, res) {
  const { id } = req.body;
  const gh = getGhFromReq(req);
  const data = await readData(gh);
  data.webhooks = (data.webhooks || []).filter(w => w.id !== id);
  await writeData(data, gh);
  return res.status(200).json({ success: true });
}

// Utility: fire webhooks (call from other API routes)
async function fireWebhooks(event, payload, gh) {
  try {
    const data = await readData(gh);
    const webhooks = (data.webhooks || []).filter(w => w.enabled && w.events.includes(event));

    for (const wh of webhooks) {
      try {
        const body = formatWebhookPayload(wh.platform, event, payload);
        await fetch(wh.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } catch {}
    }
  } catch {}
}

function formatWebhookPayload(platform, event, payload) {
  if (platform === 'discord') {
    const emoji = event === 'anime.added' ? '✅' : event === 'anime.deleted' ? '🗑️' : '🚀';
    return {
      embeds: [{
        title: `${emoji} ${event.replace('.', ' ').toUpperCase()}`,
        description: payload.title || payload.message || JSON.stringify(payload),
        color: event.includes('added') ? 0x10b981 : event.includes('deleted') ? 0xef4444 : 0x7c3aed,
        timestamp: new Date().toISOString()
      }]
    };
  }

  if (platform === 'telegram') {
    const emoji = event === 'anime.added' ? '✅' : event === 'anime.deleted' ? '🗑️' : '🚀';
    return {
      text: `${emoji} *${event.replace('.', ' ').toUpperCase()}*\n${payload.title || payload.message || ''}`,
      parse_mode: 'Markdown'
    };
  }

  return { event, payload, timestamp: new Date().toISOString() };
}

module.exports = { fireWebhooks };
