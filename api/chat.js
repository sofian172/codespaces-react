export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI Gateway غير مهيأ على الخادم.' });
  try {
    const { messages = [], files = [] } = req.body || {};
    const fileContext = files.length ? `\n\nAttached files:\n${files.map((f) => `--- ${f.name} ---\n${f.content}`).join('\n')}` : '';
    const system = `You are Agentic AI, a fast, practical coding and project assistant. Work step-by-step, be concise, inspect provided files carefully, and never claim to have executed an action unless the application actually did it. You can suggest GitHub/Vercel workflows but do not expose secrets. User language is Arabic when appropriate.${fileContext}`;
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-5.2-fast', messages: [{ role: 'system', content: system }, ...messages], temperature: 0.2, max_tokens: 4096 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'AI Gateway request failed' });
    return res.status(200).json({ text: data?.choices?.[0]?.message?.content || 'لم يصل رد من النموذج.' });
  } catch (error) { return res.status(500).json({ error: error.message || 'Server error' }); }
}
