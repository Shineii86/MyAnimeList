const { authenticate, createToken } = require('../../lib/auth');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  if (!authenticate(password)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = createToken();

  res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`);
  
  return res.status(200).json({ success: true, message: 'Authenticated' });
}
