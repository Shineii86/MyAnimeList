const { authenticate, createToken } = require('../../lib/auth');
const { addEntry } = require('../../lib/activity-log');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (!authenticate(password)) {
    addEntry({ action: 'login', target: 'Admin Panel', details: 'Failed login attempt' });
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = createToken();

  res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`);
  
  addEntry({ action: 'login', target: 'Admin Panel', details: 'Successful login' });

  return res.status(200).json({ success: true, message: 'Authenticated' });
}
