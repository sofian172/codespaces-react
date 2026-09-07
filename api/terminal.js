const allowed = {
  help: 'help — show commands\npwd — show workspace path\nls — list workspace entries\nwhoami — show sandbox user\nclear — clear terminal',
  pwd: '/workspace',
  ls: 'src/\napi/\npackage.json\nREADME.md',
  whoami: 'agentic-sandbox',
};

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const command = String(req.body?.command || '').trim().toLowerCase();
  if (!command) return res.status(400).json({ error: 'No command' });
  if (command === 'clear') return res.status(200).json({ output: '' });
  if (Object.prototype.hasOwnProperty.call(allowed, command)) return res.status(200).json({ output: allowed[command] });
  return res.status(400).json({ error: 'هذا الأمر غير متاح في الـ sandbox. استخدم help.' });
}
